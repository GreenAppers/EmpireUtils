import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
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
import { AddIcon } from '@chakra-ui/icons'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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

  if (versionManifests.isError)
    return (
      <>
        <Box>Error loading version manifests</Box>
        {versionManifests.error.message}
      </>
    )

  if (!versionManifests.isSuccess || createGameInstallMutation.isPending)
    return <Spinner />

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>New Install</ModalHeader>
        <ModalCloseButton />
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
                setNewInstall((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            mr={3}
            onClick={() => createGameInstallMutation.mutate(newInstall)}
          >
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export function Launcher() {
  const gameInstalls = useGameInstallsQuery()
  const [showNewInstall, setShowNewInstall] = useState(false)

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

      <List>
        {gameInstalls.isSuccess &&
          gameInstalls.data.map((x) => (
            <ListItem key={x.name}>{x.name}</ListItem>
          ))}
      </List>
    </>
  )
}
