import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Image,
  Input,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spacer,
  Spinner,
  Text,
  Tooltip,
} from '@chakra-ui/react'
import { AddIcon, EditIcon } from '@chakra-ui/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import {
  findVersionManifest,
  GameInstall,
  getGameInstallIsHacked,
  getGameInstalModLoaderName,
  ModLoaderName,
  MojangVersionManifests,
  mojangVersionManifests,
  QUERY_KEYS,
  setGameInstallModLoaderName,
  STORE_KEYS,
  toggleGameInstallModeUrl,
} from '../constants'
import { mods } from '../utils/mods'

const defaultVersion = '1.20.6'

function assertValue<X>(x: X | undefined | null, name?: string): X {
  if (!x) throw new Error(`missing ${name}`)
  return x
}

export const useGameInstallsQuery = () =>
  useQuery<GameInstall[]>({
    queryKey: [QUERY_KEYS.useGameInstalls],
    queryFn: () => window.api.store.get(STORE_KEYS.gameInstalls),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

export const useCreateGameInstallMutation = (options?: {
  callback?: (gameInstall?: GameInstall, error?: unknown) => void
}) => {
  const queryClient = useQueryClient()
  return useMutation<GameInstall, unknown, Partial<GameInstall>>({
    mutationFn: (newGameInstall) =>
      window.api.createGameInstall({
        ...newGameInstall,
        name: assertValue(
          newGameInstall.name,
          'useCreateGameInstallMutation name'
        ),
        path: newGameInstall.path || '',
        uuid: newGameInstall.uuid || '',
        versionManifest: assertValue(
          newGameInstall.versionManifest,
          'useCreateGameInstallMutation versionManifest'
        ),
      }),
    onSuccess: (gameInstall) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.useGameInstalls] })
      if (options?.callback) options.callback(gameInstall, undefined)
    },
    onError: (error) => {
      if (options?.callback) options.callback(undefined, error)
    },
  })
}

export const useDeleteGameInstallMutation = (options?: {
  callback?: (error?: unknown) => void
}) => {
  const queryClient = useQueryClient()
  return useMutation<boolean, unknown, GameInstall>({
    mutationFn: (deleteGameInstall) =>
      window.api.deleteGameInstall(deleteGameInstall),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.useGameInstalls] })
      if (options?.callback) options.callback(undefined)
    },
    onError: (error) => {
      if (options?.callback) options.callback(error)
    },
  })
}

export const useMojangVersionManifestsQuery = () =>
  useQuery<MojangVersionManifests>({
    queryKey: [QUERY_KEYS.useMojangVersionManifests],
    queryFn: async () => {
      const { data } = await axios.get(
        'https://launchermeta.mojang.com/mc/game/version_manifest.json'
      )
      return mojangVersionManifests.parse(data)
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

export function NewGameInstall(props: {
  existingInstall?: GameInstall
  isOpen: boolean
  onClose: () => void
}) {
  const [newInstall, setNewInstall] = useState<Partial<GameInstall>>(
    props.existingInstall ?? {
      name: '',
      path: '',
      versionManifest: undefined,
    }
  )

  const updateNewInstallVersionManifest = (version: string) => {
    const newVersionManifest = findVersionManifest(
      versionManifests.data,
      version
    )
    if (!newVersionManifest) return
    setNewInstall((prev) => ({
      ...prev,
      name:
        !prev.name || prev.name === prev.versionManifest?.id
          ? newVersionManifest.id
          : prev.name,
      versionManifest: newVersionManifest,
    }))
  }

  const versionManifests = useMojangVersionManifestsQuery()
  const createGameInstallMutation = useCreateGameInstallMutation({
    callback: props.onClose,
  })

  useEffect(() => {
    if (!newInstall.versionManifest?.id && versionManifests.isSuccess) {
      const defaultVersionManifest = findVersionManifest(
        versionManifests.data,
        defaultVersion
      )
      updateNewInstallVersionManifest(
        defaultVersionManifest
          ? defaultVersion
          : versionManifests.data.latest.release
      )
    }
  }, [
    newInstall.versionManifest?.id,
    versionManifests.isSuccess,
    versionManifests.data,
  ])

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {props.existingInstall ? 'Update' : 'New'} Install
        </ModalHeader>
        <ModalCloseButton />
        {versionManifests.isError ? (
          <ModalBody>
            Error loading version manifests
            {versionManifests.error.message}
          </ModalBody>
        ) : !versionManifests.isSuccess ||
          createGameInstallMutation.isPending ? (
          <ModalBody>
            <Spinner />
          </ModalBody>
        ) : (
          <ModalBody>
            <FormControl>
              <FormLabel>Version</FormLabel>
              <Select
                value={newInstall.versionManifest?.id}
                onChange={(event) =>
                  updateNewInstallVersionManifest(event.target.value)
                }
              >
                {versionManifests.data.versions.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.id}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input
                type="name"
                value={newInstall.name}
                onChange={(event) =>
                  setNewInstall((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </FormControl>
            <FormControl>
              <FormLabel>Mod loader</FormLabel>
              <Select
                value={getGameInstalModLoaderName(newInstall)}
                onChange={(event) =>
                  setNewInstall((prev) =>
                    setGameInstallModLoaderName(prev, event.target.value)
                  )
                }
              >
                {Object.keys(ModLoaderName).map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </Select>
            </FormControl>
            {newInstall.fabricLoaderVersion && (
              <List marginTop="1rem">
                {Object.entries(
                  mods[`${newInstall?.versionManifest?.id}-fabric`] || {}
                ).map(([name, url]) => (
                  <ListItem key={name}>
                    <Checkbox
                      isChecked={newInstall?.mods?.includes(url)}
                      onChange={(e) =>
                        setNewInstall((prev) =>
                          toggleGameInstallModeUrl(
                            prev,
                            url,
                            !!e.target.checked
                          )
                        )
                      }
                    >
                      {name}
                    </Checkbox>
                  </ListItem>
                ))}
              </List>
            )}
          </ModalBody>
        )}
        <ModalFooter>
          {versionManifests.isSuccess &&
            !createGameInstallMutation.isPending && (
              <Button
                mr={3}
                onClick={() => createGameInstallMutation.mutate(newInstall)}
              >
                {props.existingInstall ? 'Update' : 'Create'}
              </Button>
            )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export function LaunchGameInstall(props: {
  isOpen: boolean
  launchId: string
  install: GameInstall
  onClose: () => void
}) {
  useEffect(() => {
    if (!props.isOpen || !props.launchId) return
    const handle = window.api.launchGameInstall(
      props.launchId,
      props.install,
      (text) => {
        console.log(props.launchId, text)
      }
    )
    return () => window.api.removeListener(handle)
  }, [props.isOpen, props.launchId])

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Launching {props.install.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Spinner />
        </ModalBody>
        <ModalFooter>
          <Button onClick={props.onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export function Launcher() {
  const gameInstalls = useGameInstallsQuery()
  const [showNewInstall, setShowNewInstall] = useState(false)
  const [updateExistingInstall, setUpdateExistingInstall] = useState<
    GameInstall | undefined
  >(undefined)
  const [launched, setLaunched] = useState<
    Record<string, { install: GameInstall; show: boolean }>
  >({})

  return (
    <>
      <Flex>
        <Heading>
          <Tooltip label="Launcher">🚀</Tooltip>
        </Heading>
        <Box>
          <Tooltip label="New install">
            <IconButton
              aria-label="New install"
              icon={<AddIcon />}
              onClick={() => setShowNewInstall((prev) => !prev)}
            />
          </Tooltip>
        </Box>
      </Flex>

      {showNewInstall && (
        <NewGameInstall
          isOpen={showNewInstall}
          onClose={() => setShowNewInstall(false)}
        />
      )}

      {updateExistingInstall && (
        <NewGameInstall
          existingInstall={updateExistingInstall}
          isOpen={!!updateExistingInstall}
          onClose={() => setUpdateExistingInstall(undefined)}
        />
      )}

      {Object.entries(launched).map(
        ([id, { install, show }]) =>
          show && (
            <LaunchGameInstall
              key={id}
              launchId={id}
              install={install}
              isOpen={show}
              onClose={() =>
                setLaunched((prev) => ({
                  ...prev,
                  [id]: { ...prev[id], show: false },
                }))
              }
            />
          )
      )}

      <List marginTop="1rem">
        {gameInstalls.isSuccess &&
          gameInstalls.data.map((install, i) => (
            <ListItem key={install.name} height="5rem">
              <Flex alignItems="center">
                <IconButton
                  aria-label="gameInstall"
                  marginRight="1rem"
                  width="4rem"
                  icon={
                    <Image
                      src={
                        i % 2 === 0
                          ? 'app-file://images/icons/grassblock.png'
                          : 'app-file://images/icons/creeper.png'
                      }
                    />
                  }
                  onClick={() =>
                    setLaunched((prev) => ({
                      ...prev,
                      [uuidv4()]: { install: install, show: true },
                    }))
                  }
                />
                <Box>
                  <Heading as="h5" size="sm">
                    <Flex>
                      <Text>
                        {install.name +
                          (install.versionManifest.id !== install.name
                            ? `: ${install.versionManifest.id}`
                            : '')}
                        &nbsp;
                      </Text>

                      {getGameInstalModLoaderName(install) ===
                      ModLoaderName.Fabric ? (
                        getGameInstallIsHacked(install) ? (
                          <Text color="red.500">[Hacked]</Text>
                        ) : (
                          <Text color="orange.200">[Fabric, Allowed mods]</Text>
                        )
                      ) : (
                        <Text color="yellow.100">[Vanilla]</Text>
                      )}
                    </Flex>
                  </Heading>
                  {install.uuid}
                </Box>
                <Spacer />
                <Box>
                  <Tooltip label={`Edit ${install.name}`}>
                    <IconButton
                      aria-label={`Edit ${install.name}`}
                      icon={<EditIcon />}
                      onClick={() => setUpdateExistingInstall(install)}
                    />
                  </Tooltip>
                </Box>
              </Flex>
            </ListItem>
          ))}
      </List>
    </>
  )
}
