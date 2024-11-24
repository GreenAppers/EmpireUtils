import {
  Button,
  Checkbox,
  FormControl,
  FormLabel,
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
  useToken,
} from '@chakra-ui/react'
import React, { useEffect, useState } from 'react'

import {
  findVersionManifest,
  GameInstall,
  getGameInstalModLoaderName,
  ModLoaderName,
  setGameInstallModLoaderName,
  toggleGameInstallModeUrl,
} from '../constants'
import { useMojangVersionManifestsQuery } from '../hooks/useMojang'
import { useCreateGameInstallMutation } from '../hooks/useStore'
import { mods } from '../utils/mods'

export const defaultVersion = '1.20.6'

export function NewGameInstall(props: {
  existingInstall?: GameInstall
  isOpen: boolean
  onClose: () => void
}) {
  const [yellow100] = useToken('colors', ['yellow.100'])
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
    <Modal colorScheme="yellow" isOpen={props.isOpen} onClose={props.onClose}>
      <ModalOverlay />
      <ModalContent
        color="chakra-body-text"
        bgImage="app-file://images/icons/dstiles.png"
        bgSize={64}
        border={`${yellow100} 2px solid`}
      >
        <ModalHeader color={yellow100} bgColor="rgba(0, 0, 0, 0.3)">
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
          <ModalBody bgColor="rgba(0, 0, 0, 0.6)">
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
        <ModalFooter bgColor="rgba(0, 0, 0, 0.3)">
          {versionManifests.isSuccess &&
            !createGameInstallMutation.isPending && (
              <Button
                color={yellow100}
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
