import { CSSProperties, useEffect, useRef } from 'react'
import { MinecraftProfile, minecraftProfileState } from '../constants'
import { Tooltip } from '@chakra-ui/react'

export function PlayerHead(props: {
  headSize?: number
  profile?: MinecraftProfile
}) {
  const headSize = props.headSize || 120
  const halfHeadSize = headSize / 2
  const helmExtraSize = headSize / 24
  const helmSize = headSize + helmExtraSize
  const halfHelmSize = helmSize / 2

  const canvasFrontRef = useRef<HTMLCanvasElement>(null)
  const canvasBackRef = useRef<HTMLCanvasElement>(null)
  const canvasLeftRef = useRef<HTMLCanvasElement>(null)
  const canvasRightRef = useRef<HTMLCanvasElement>(null)
  const canvasTopRef = useRef<HTMLCanvasElement>(null)
  const canvasBottomRef = useRef<HTMLCanvasElement>(null)
  const canvasHelmFrontRef = useRef<HTMLCanvasElement>(null)
  const canvasHelmBackRef = useRef<HTMLCanvasElement>(null)
  const canvasHelmLeftRef = useRef<HTMLCanvasElement>(null)
  const canvasHelmRightRef = useRef<HTMLCanvasElement>(null)
  const canvasHelmTopRef = useRef<HTMLCanvasElement>(null)
  const canvasHelmBottomRef = useRef<HTMLCanvasElement>(null)
  const divHeadRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!divHeadRef.current) return
      divHeadRef.current.style.transform =
        `translateZ(-${halfHeadSize}px) ` +
        `rotateY(${event.clientX / 12 - 60}deg) ` +
        `rotateX(${-Math.min(event.clientY, 400) / 16}deg)`
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  useEffect(() => {
    const img = imgRef.current
    if (!img) return

    img.onload = () => {
      /* Head (1/6) Front face */
      if (canvasFrontRef.current) {
        const ctx = canvasFrontRef.current.getContext('2d')
        if (ctx) {
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(img, 8, 8, 8, 8, 0, 0, headSize, headSize)
        }
      }

      /* Head (2/6) Back face */
      if (canvasBackRef.current) {
        const ctx = canvasBackRef.current.getContext('2d')
        if (ctx) {
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(img, 24, 8, 8, 8, 0, 0, headSize, headSize)
        }
      }

      /* Head (3/6) Left face */
      if (canvasLeftRef.current) {
        const ctx = canvasLeftRef.current.getContext('2d')
        if (ctx) {
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(img, 16, 8, 8, 8, 0, 0, headSize, headSize)
        }
      }

      /* Head (4/6) Right face */
      if (canvasRightRef.current) {
        const ctx = canvasRightRef.current.getContext('2d')
        if (ctx) {
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(img, 0, 8, 8, 8, 0, 0, headSize, headSize)
        }
      }

      /* Head (5/6) Top face */
      if (canvasTopRef.current) {
        const ctx = canvasTopRef.current.getContext('2d')
        if (ctx) {
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(img, 8, 0, 8, 8, 0, 0, headSize, headSize)
        }
      }

      /* Head (6/6) Bottom face */
      if (canvasBottomRef.current) {
        const ctx = canvasBottomRef.current.getContext('2d')
        if (ctx) {
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(img, 16, 0, 8, 8, 0, 0, headSize, headSize)
        }
      }

      /* Helm (1/6) Front face */
      if (canvasHelmFrontRef.current) {
        const ctx = canvasHelmFrontRef.current.getContext('2d')
        if (ctx) {
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(img, 40, 8, 8, 8, 0, 0, helmSize, helmSize)
        }
      }

      /* Helm (2/6) Back face */
      if (canvasHelmBackRef.current) {
        const ctx = canvasHelmBackRef.current.getContext('2d')
        if (ctx) {
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(img, 56, 8, 8, 8, 0, 0, helmSize, helmSize)
        }
      }

      /* Helm (3/6) Left face */
      if (canvasHelmLeftRef.current) {
        const ctx = canvasHelmLeftRef.current.getContext('2d')
        if (ctx) {
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(img, 48, 8, 8, 8, 0, 0, helmSize, helmSize)
        }
      }

      /* Helm (4/6) Right face */
      if (canvasHelmRightRef.current) {
        const ctx = canvasHelmRightRef.current.getContext('2d')
        if (ctx) {
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(img, 32, 8, 8, 8, 0, 0, helmSize, helmSize)
        }
      }

      /* Helm (5/6) Top face */
      if (canvasHelmTopRef.current) {
        const ctx = canvasHelmTopRef.current.getContext('2d')
        if (ctx) {
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(img, 40, 0, 8, 8, 0, 0, helmSize, helmSize)
        }
      }

      /* Helm (6/6) Bottom face */
      if (canvasHelmBottomRef.current) {
        const ctx = canvasHelmBottomRef.current.getContext('2d')
        if (ctx) {
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(img, 48, 0, 8, 8, 0, 0, helmSize, helmSize)
        }
      }
    }
  }, [imgRef.current])

  const headStyle: CSSProperties = {
    display: 'block',
    position: 'absolute',
    width: headSize,
    height: headSize,
    overflow: 'hidden',
    opacity: '1',
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  }

  const helmStyle: CSSProperties = {
    left: `-${helmExtraSize}px`,
    top: `-${helmExtraSize}px`,
    display: 'block',
    position: 'absolute',
    width: helmSize,
    height: helmSize,
    overflow: 'hidden',
    opacity: '1',
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  }

  return (
    <div>
      <section
        style={{
          width: `${headSize}px`,
          height: `${headSize}px`,
          position: 'relative',
          margin: `0 auto ${headSize / 3}px`,
          perspective: `${headSize * 8}px`,
        }}
      >
        <img
          alt="Player Skin"
          ref={imgRef}
          src={
            props.profile?.skins?.find(
              (x) => x.state === minecraftProfileState.Values.ACTIVE
            )?.url
          }
          style={{ display: 'none' }}
        />

        <Tooltip label={props.profile?.name}>
          {/* Head is made from six faces each for Head and Helm */}
          <div
            ref={divHeadRef}
            style={{
              top: '20px',
              width: '100%',
              height: '100%',
              position: 'absolute',
              transformStyle: 'preserve-3d',
              transform: `translateZ(-${halfHeadSize}px) rotateY(0deg) rotateX(0deg)`,
            }}
          >
            {/* Head (1/6) Front face */}
            <div
              style={{
                ...headStyle,
                transform: `translateZ(${halfHeadSize}px)`,
              }}
            >
              <canvas height={headSize} width={headSize} ref={canvasFrontRef} />
            </div>

            {/* Head (2/6) Back face */}
            <div
              style={{
                ...headStyle,
                transform: `rotateX(-180deg) translateZ(${halfHeadSize}px) rotateZ(180deg)`,
              }}
            >
              <canvas height={headSize} width={headSize} ref={canvasBackRef} />
            </div>

            {/* Head (3/6) Left face */}
            <div
              style={{
                ...headStyle,
                transform: `rotateY(-90deg) translateZ(${halfHeadSize}px)`,
              }}
            >
              <canvas height={headSize} width={headSize} ref={canvasLeftRef} />
            </div>

            {/* Head (4/6) Right face */}
            <div
              style={{
                ...headStyle,
                transform: `rotateY(90deg) translateZ(${halfHeadSize}px)`,
              }}
            >
              <canvas height={headSize} width={headSize} ref={canvasRightRef} />
            </div>

            {/* Head (5/6) Top face */}
            <div
              style={{
                ...headStyle,
                transform: `rotateX(90deg) translateZ(${halfHeadSize}px)`,
              }}
            >
              <canvas height={headSize} width={headSize} ref={canvasTopRef} />
            </div>

            {/* Head (6/6) Bottom face */}
            <div
              style={{
                ...headStyle,
                transform: `rotateX(-90deg) translateZ(${halfHeadSize}px) rotateZ(180deg)`,
              }}
            >
              <canvas
                height={headSize}
                width={headSize}
                ref={canvasBottomRef}
              />
            </div>

            {/* Helm (1/6) Front face */}
            <div
              style={{
                ...helmStyle,
                transform: `translateZ(${halfHelmSize}px)`,
              }}
            >
              <canvas
                height={helmSize}
                width={helmSize}
                ref={canvasHelmFrontRef}
              />
            </div>

            {/* Helm (2/6) Back face */}
            <div
              style={{
                ...helmStyle,
                transform: `rotateX(-180deg) translateZ(${halfHelmSize}px) rotateZ(180deg)`,
              }}
            >
              <canvas
                height={helmSize}
                width={helmSize}
                ref={canvasHelmBackRef}
              />
            </div>

            {/* Helm (3/6) Left face */}
            <div
              style={{
                ...helmStyle,
                transform: `rotateY(-90deg) translateZ(${halfHelmSize}px)`,
              }}
            >
              <canvas
                height={helmSize}
                width={helmSize}
                ref={canvasHelmLeftRef}
              />
            </div>

            {/* Helm (4/6) Right face */}
            <div
              style={{
                ...helmStyle,
                transform: `rotateY(90deg) translateZ(${halfHelmSize}px)`,
              }}
            >
              <canvas
                height={helmSize}
                width={helmSize}
                ref={canvasHelmRightRef}
              />
            </div>

            {/* Helm (5/6) Top face */}
            <div
              style={{
                ...helmStyle,
                transform: `rotateX(90deg) translateZ(${halfHelmSize}px)`,
              }}
            >
              <canvas
                height={helmSize}
                width={helmSize}
                ref={canvasHelmTopRef}
              />
            </div>

            {/* Helm (6/6) Bottom face */}
            <div
              style={{
                ...helmStyle,
                transform: `rotateX(-90deg) translateZ(${halfHelmSize}px) rotateZ(180deg)`,
              }}
            >
              <canvas
                height={helmSize}
                width={helmSize}
                ref={canvasHelmBottomRef}
              />
            </div>
          </div>
        </Tooltip>
      </section>
    </div>
  )
}
