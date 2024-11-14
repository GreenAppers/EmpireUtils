import { app, shell } from 'electron'
import {
  PublicClientApplication,
  LogLevel,
  AccountInfo,
  AuthenticationResult,
  InteractiveRequest,
  InteractionRequiredAuthError,
} from '@azure/msal-node'
import log from 'electron-log/main'
import path from 'path'

import { cachePlugin } from './CachePlugin'
import { CustomLoopbackClient } from './CustomLoopbackClient'

const openBrowser = (url: string) => shell.openExternal(url)

export class AuthProvider {
  private clientApplication: PublicClientApplication
  private account: AccountInfo | null

  constructor() {
    this.clientApplication = new PublicClientApplication({
      auth: {
        authority: 'https://login.microsoftonline.com/consumers/',
        clientId: process.env.MICROSOFT_ENTRA_CLIENT_ID ?? '',
      },
      cache: {
        cachePlugin: cachePlugin(
          path.join(app.getPath('userData'), 'auth.json')
        ),
      },
      system: {
        loggerOptions: {
          loggerCallback: (level, message) => {
            switch (level) {
              case LogLevel.Error:
                log.error(message)
                break
              case LogLevel.Warning:
                log.warn(message)
                break
              case LogLevel.Info:
                log.info(message)
                break
              case LogLevel.Verbose:
                log.verbose(message)
                break
              case LogLevel.Trace:
                log.debug(message)
                break
            }
          },
          logLevel: LogLevel.Info,
          piiLoggingEnabled: false,
        },
      },
    })
  }

  async login(): Promise<AuthenticationResult | null> {
    const authResult = await this.getToken()
    return this.handleResponse(authResult)
  }

  async logout(): Promise<void> {
    try {
      if (!this.account) return
      await this.clientApplication.getTokenCache().removeAccount(this.account)
      this.account = null
    } catch (error) {
      console.log(error)
    }
  }

  async getToken(
    scopes = ['XboxLive.signin', 'XboxLive.offline_access']
  ): Promise<AuthenticationResult> {
    let authResponse: AuthenticationResult | undefined
    const account = this.account || (await this.getAccount())
    if (account) {
      try {
        authResponse = await this.clientApplication.acquireTokenSilent({
          account,
          scopes,
        })
      } catch (error) {
        if (!(error instanceof InteractionRequiredAuthError)) throw error
      }
    }
    if (!authResponse) {
      authResponse = await this.getTokenInteractive({ openBrowser, scopes })
    }
    this.account = authResponse.account
    return authResponse
  }

  async getTokenInteractive(
    tokenRequest: InteractiveRequest
  ): Promise<AuthenticationResult> {
    /**
     * A loopback server of your own implementation, which can have custom logic
     * such as attempting to listen on a given port if it is available.
     */
    const customLoopbackClient = await CustomLoopbackClient.initialize(3874)

    const interactiveRequest: InteractiveRequest = {
      ...tokenRequest,
      successTemplate:
        '<h1>Successfully signed in!</h1> <p>You can close this window now.</p>',
      errorTemplate:
        '<h1>Oops! Something went wrong</h1> <p>Check the console for more information.</p>',
      loopbackClient: customLoopbackClient, // overrides default loopback client
    }

    const authResponse = await this.clientApplication.acquireTokenInteractive(
      interactiveRequest
    )
    return authResponse
  }

  /**
   * Handles the response from a popup or redirect. If response is null, will check if we have any accounts and attempt to sign in.
   * @param response
   */
  private async handleResponse(response: AuthenticationResult) {
    this.account = response?.account || (await this.getAccount())
    return response
  }

  public currentAccount(): AccountInfo | null {
    return this.account
  }

  private async getAccount(): Promise<AccountInfo | null> {
    const cache = this.clientApplication.getTokenCache()
    const currentAccounts = await cache.getAllAccounts()

    if (currentAccounts === null) {
      console.log('No accounts detected')
      return null
    }

    if (currentAccounts.length > 1) {
      console.log(
        'Multiple accounts detected, need to add choose account code.'
      )
      return currentAccounts[0]
    } else if (currentAccounts.length === 1) {
      return currentAccounts[0]
    } else {
      return null
    }
  }
}
