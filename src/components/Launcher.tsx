import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Image,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Spinner,
  Text,
  Tooltip,
  useToken,
} from '@chakra-ui/react'
import { AddIcon, EditIcon, ViewIcon } from '@chakra-ui/icons'
import React, { useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import {
  GameInstall,
  getGameInstallIsHacked,
  getGameInstalModLoaderName,
  LAUNCH_STATUS,
  ModLoaderName,
  removeProperty,
} from '../constants'
import { useGameInstallsQuery } from '../hooks/useStore'
import { NewGameInstall } from './NewGameInstall'

interface RunningLaunch {
  install: GameInstall
  processId?: number
  show: boolean
}

export function LaunchedGame(props: {
  launchId: string
  launched: RunningLaunch
  onClose: () => void
  onFinished: () => void
  onProcessId: (processId: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const [purple100] = useToken('colors', ['purple.100'])
  const [status, setStatus] = useState<string>('Launching')

  useEffect(() => {
    if (!props.launchId) return
    const handle = window.api.launchGameInstall(
      props.launchId,
      props.launched.install,
      (message) => {
        if (message.message) {
          if (message.message.includes('Setting user')) setStatus('Running')
          if (textRef.current) textRef.current.textContent += message.message
          if (containerRef.current)
            containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
        if (message.processId) props.onProcessId(message.processId)
        if (message.status === LAUNCH_STATUS.finished) props.onFinished()
      }
    )
    return () => window.api.removeListener(handle)
  }, [props.launchId])

  return (
    <Modal isOpen={props.launched.show} onClose={props.onClose}>
      <ModalOverlay />
      <ModalContent
        color="chakra-body-text"
        bgImage="app-file://images/icons/obsidian.png"
        bgSize={64}
        border={`${purple100} 2px solid`}
        minWidth="fit-content"
        height="fit-content"
      >
        <ModalHeader bgColor="rgba(0, 0, 0, 0.3)" color={purple100}>
          {status} {props.launched.install.name}
          {props.launched.processId ? `: Pid ${props.launched.processId}` : ''}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Spinner />
          <div
            ref={containerRef}
            style={{ height: '400px', width: '800px', overflow: 'auto' }}
          >
            <p ref={textRef} />
          </div>
        </ModalBody>
        <ModalFooter bgColor="rgba(0, 0, 0, 0.3)">
          <Button color={purple100} onClick={props.onClose}>
            Close
          </Button>
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
  const [running, setRunning] = useState<Record<string, RunningLaunch>>({})

  const setRunningProps = (id: string, props: Partial<RunningLaunch>) =>
    setRunning((prev) => {
      const prevLaunch = prev[id]
      if (!prevLaunch) return prev
      return {
        ...prev,
        [id]: { ...prevLaunch, ...props },
      }
    })

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

      {Object.entries(running).map(([id, launched]) => (
        <LaunchedGame
          key={id}
          launchId={id}
          launched={launched}
          onClose={() => setRunningProps(id, { show: false })}
          onFinished={() => setRunning((prev) => removeProperty(prev, id))}
          onProcessId={(processId) => setRunningProps(id, { processId })}
        />
      ))}

      <List marginTop="1rem">
        {gameInstalls.isSuccess &&
          gameInstalls.data.map((install) => (
            <ListItem key={install.uuid} height="5rem">
              <Flex
                alignItems="center"
                _hover={{ backgroundColor: 'rgba(120, 120, 120, 0.3)' }}
              >
                <Tooltip label={`Launch ${install.name}`}>
                  <IconButton
                    aria-label="gameInstall"
                    marginRight="1rem"
                    width="4rem"
                    icon={
                      <Image src={`install-file://${install.uuid}/icon.png`} />
                    }
                    onClick={() =>
                      setRunning((prev) => ({
                        ...prev,
                        [uuidv4()]: { install: install, show: true },
                      }))
                    }
                  />
                </Tooltip>
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
                      ModLoaderName.fabric ? (
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
                {Object.entries(running)
                  .filter(([, v]) => v.install.uuid === install.uuid)
                  .map(([id, { install, processId }]) => {
                    const label =
                      (processId ? `Pid ${processId} ` : `Running `) +
                      install.name
                    return (
                      <Box key={id}>
                        <Tooltip label={label}>
                          <IconButton
                            aria-label={label}
                            icon={<ViewIcon />}
                            onClick={() => setRunningProps(id, { show: true })}
                          />
                        </Tooltip>
                        &nbsp;
                      </Box>
                    )
                  })}
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
