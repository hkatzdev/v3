import React, { useState, useMemo, useRef, useEffect } from 'react'
import useWebSocket from 'react-use-websocket'
import { Box, Text } from 'theme-ui'
import { take, sample } from 'lodash'
import { Slide } from 'react-reveal'

const types = {
  user_typing: 'typing',
  reaction_added: 'reaction',
  unmarshalling_error: 'message',
  message: 'message'
}

const emoji = ['🚀', '🥳', '😂', '💖', '👀', '👍', '🙌', '🙂', '👏']
const colors = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', '#8067c3']

const Channel = ({ color, channel }) => (
  <Text as="strong" color={color} children={channel} />
)

const whitelistedChannels = new Set(`
  3d-printing all-hands apple art blockchain cats
  challenges code college-apps coronavirus deals 
  debate design design dogs ethical-hacking film
  functional
  gamedev go-bears hack-night hackathons hardware 
  homelab
  hq india
  languages late-night-hq-club lgbtq linux lounge
  mason math memes minecraft music photography python
  rust
  ship sink-my-ship
  sleep social studycorner support us-politics
  welcome westborough workshops
`.split(/\s+/ig).filter((i) => i.length > 0).map((i) => "#" + i));

export default ({ sx, ...props }) => {
  const didUnmount = useRef(false)
  const [events, setEvents] = useState([
    { type: 'typing', channel: '#lounge', color: 'cyan' },
    { type: 'message', channel: '#design', color: 'red' }
  ])
  const STATIC_OPTIONS = useMemo(
    () => ({
      shouldReconnect: () => !didUnmount.current,
      reconnectInterval: 3000
    }),
    []
  )
  const [sendEvent, lastEvent] = useWebSocket(
    'wss://streambot-hackclub.herokuapp.com/',
    STATIC_OPTIONS
  )

  useEffect(() => {
    let e = lastEvent?.data
    if (e) {
      try {
        e = JSON.parse(e)
        if (Object.keys(types).includes(e.type) && whitelistedChannels.has(e.channel)) {
          e.type = types[e.type]
          e.color = sample(colors)
          if (e.type === 'reaction') e.emoji = sample(emoji)
          setEvents((prev) => [e, ...prev])
        }
      } catch (err) {
        true
      }
    }
  }, [lastEvent])

  useEffect(() => {
    return () => {
      didUnmount.current = true
    }
  })

  return (
    <Box
      as="ol"
      sx={{
        height: '100%',
        minHeight: events.length === 0 ? 'none' : '4em',
        maxHeight: ['6em', '100%'],
        overflow: 'hidden',
        listStyle: 'none',
        lineHeight: 'heading',
        pl: 0,
        color: 'black',
        fontSize: 2,
        overflowY: 'hidden',
        position: 'relative',
        ':after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'block',
          height: '2em',
          backgroundImage: (theme) =>
            `linear-gradient(rgba(255,255,255,0), ${theme.colors.white})`
        },
        div: { mb: [1, 2] },
        'circle:last-of-type': { animationDuration: '1s' },
        ...sx
      }}
      aria-hidden="true"
      {...props}
    >
      {take(events, 7).map(({ timestamp, type, emoji, ...channel }) => (
        <Slide top duration={256} key={timestamp}>
          <>
            Someone{' '}
            {type === 'message' && (
              <>
                messaged <Channel {...channel} />
              </>
            )}
            {type === 'typing' && (
              <>
                is typing in <Channel {...channel} />
              </>
            )}
            {type === 'reaction' && (
              <>
                in <Channel {...channel} /> reacted with {emoji}
              </>
            )}
          </>
        </Slide>
      ))}
    </Box>
  )
}
