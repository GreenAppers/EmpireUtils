import axios from 'axios'
import {
  GameAccount,
  minecraftLoginResponse,
  minecraftProfile,
  xboxLiveProfile,
  xstsAuthorizeResponse,
} from '../constants'
import { Store, StoreSchema, updateGameAccount } from '../store'

// References:
// - https://mojang-api-docs.gapple.pw/
// - https://minecraft-launcher-lib.readthedocs.io/en/stable/tutorial/microsoft_login.html
// - https://learn.microsoft.com/en-us/gaming/gdk/_content/gc/commerce/service-to-service/xstore-requesting-a-userstoreid-from-services

export const formatXSTSToken = (uhs: string, token: string) =>
  `XBL3.0 x=${uhs};${token}`

export const postXSTSUserAuthenticate = (microsoftToken: string) =>
  axios
    .post('https://user.auth.xboxlive.com/user/authenticate', {
      Properties: {
        AuthMethod: 'RPS',
        SiteName: 'user.auth.xboxlive.com',
        RpsTicket: `d=${microsoftToken}`,
      },
      RelyingParty: 'http://auth.xboxlive.com',
      TokenType: 'JWT',
    })
    .then((response) => xstsAuthorizeResponse.parse(response.data))

export const postXSTSAuthorize = (
  userToken: string,
  relyingParty: 'rp://api.minecraftservices.com/' | 'http://xboxlive.com'
) =>
  axios
    .post('https://xsts.auth.xboxlive.com/xsts/authorize', {
      Properties: {
        SandboxId: 'RETAIL',
        UserTokens: [userToken],
      },
      RelyingParty: relyingParty,
      TokenType: 'JWT',
    })
    .then((response) => xstsAuthorizeResponse.parse(response.data))

export const postMinecraftLauncherLogin = (uhs: string, token: string) =>
  axios
    .post('https://api.minecraftservices.com/launcher/login', {
      xtoken: formatXSTSToken(uhs, token),
      platform: 'PC_LAUNCHER',
    })
    .then((response) => minecraftLoginResponse.parse(response.data))

export const postMinecraftLoginWithXBox = (uhs: string, token: string) =>
  axios
    .post('https://api.minecraftservices.com/authentication/login_with_xbox', {
      identityToken: formatXSTSToken(uhs, token),
      ensureLegacyEnabled: true,
    })
    .then((response) => minecraftLoginResponse.parse(response.data))

export const getXBoxLiveProfile = (uhs: string, token: string) =>
  axios
    .get(
      'https://profile.xboxlive.com/users/me/profile/settings?settings=' +
        encodeURIComponent(
          'GameDisplayName,AppDisplayName,AppDisplayPicRaw,GameDisplayPicRaw,' +
            'PublicGamerpic,ShowUserAsAvatar,Gamerscore,Gamertag,ModernGamertag,ModernGamertagSuffix,' +
            'UniqueModernGamertag,AccountTier,TenureLevel,XboxOneRep,' +
            'PreferredColor,Location,Bio,Watermarks,' +
            'RealName,RealNameOverride,IsQuarantined'
        ),
      {
        headers: {
          'x-xbl-contract-version': '3',
          Authorization: formatXSTSToken(uhs, token),
        },
      }
    )
    .then((response) => xboxLiveProfile.parse(response.data))

export const getMinecraftProfile = (token: string) =>
  axios
    .get('https://api.minecraftservices.com/minecraft/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => minecraftProfile.parse(response.data))

export async function loginToMinecraft(
  microsoftToken: string | undefined,
  store: Store<StoreSchema>
): Promise<GameAccount> {
  if (!microsoftToken) throw new Error('Microsoft token is required')
  const xboxLiveLogin = await postXSTSUserAuthenticate(microsoftToken)
  const xboxLiveAuth = await postXSTSAuthorize(
    xboxLiveLogin.Token,
    'http://xboxlive.com'
  )
  const minecraftAuth = await postXSTSAuthorize(
    xboxLiveLogin.Token,
    'rp://api.minecraftservices.com/'
  )
  /* const profile = await getXBoxLiveProfile(
    xboxLiveLogin.DisplayClaims.xui[0].uhs,
    xboxLiveAuth.Token
  ) */
  const login = await postMinecraftLoginWithXBox(
    minecraftAuth.DisplayClaims.xui[0].uhs,
    minecraftAuth.Token
  )
  const minecraftProfile = await getMinecraftProfile(login.access_token)
  const gameAccount: GameAccount = {
    active: true,
    profile: minecraftProfile,
    userToken: xboxLiveLogin,
    xboxliveToken: xboxLiveAuth,
    minecraftToken: minecraftAuth,
    yggdrasilToken: login,
  }
  updateGameAccount(store, gameAccount)
  return gameAccount
}
