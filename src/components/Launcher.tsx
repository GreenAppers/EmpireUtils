import {
  Box,
  Button,
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
  Spinner,
  Tooltip,
} from '@chakra-ui/react'
import { SettingsIcon } from '@chakra-ui/icons'
import { AddIcon } from '@chakra-ui/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import {
  GameInstall,
  MojangVersionManifests,
  mojangVersionManifests,
  QUERY_KEYS,
  STORE_KEYS,
} from '../constants'

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
  isOpen: boolean
  onClose: () => void
}) {
  const [newInstall, setNewInstall] = useState<Partial<GameInstall>>({
    name: '',
    path: '',
    versionManifest: undefined,
  })

  const updateNewInstallVersionManifest = (version: string) => {
    const newVersionManifest = versionManifests.data?.versions?.find(
      (x) => x.id === version
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
      updateNewInstallVersionManifest(versionManifests.data.latest.release)
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
        <ModalHeader>New Install</ModalHeader>
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
          </ModalBody>
        )}
        <ModalFooter>
          {versionManifests.isSuccess &&
            !createGameInstallMutation.isPending && (
              <Button
                mr={3}
                onClick={() => createGameInstallMutation.mutate(newInstall)}
              >
                Create
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
          gameInstalls.data.map((x, i) => (
            <ListItem key={x.name} height="5rem">
              <Flex>
                <IconButton
                  aria-label="gameInstall"
                  marginRight="1rem"
                  width="4rem"
                  icon={
                    <Image
                      src={
                        i % 2 === 0
                          ? 'https://github.com/GreenAppers/EmpireUtils/blob/dd24bcbefda54039d8882b41e16cf455403d3aa9/images/icons/grassblock.png?raw=true'
                          : 'https://github.com/GreenAppers/EmpireUtils/blob/dd24bcbefda54039d8882b41e16cf455403d3aa9/images/icons/creeper.png?raw=true'
                      }
                    />
                  }
                  onClick={() =>
                    setLaunched((prev) => ({
                      ...prev,
                      [uuidv4()]: { install: x, show: true },
                    }))
                  }
                />
                <Box>
                  <Heading as="h5" size="sm">
                    {x.name +
                      (x.versionManifest.id !== x.name
                        ? `: ${x.versionManifest.id}`
                        : '')}
                  </Heading>
                  {x.uuid}
                </Box>
              </Flex>
            </ListItem>
          ))}
      </List>
    </>
  )
}
