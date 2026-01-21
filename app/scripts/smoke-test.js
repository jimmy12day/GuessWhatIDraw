import { access, readFile } from 'node:fs/promises'
import { constants } from 'node:fs'

const requiredFiles = [
  'src/App.tsx',
  'src/components/Lobby.tsx',
  'src/components/RoomView.tsx',
  'src/state/rooms.ts',
]

const contentChecks = [
  { path: 'src/App.tsx', includes: ['useMockSocket'] },
  { path: 'src/components/Lobby.tsx', includes: ['room.players.length'] },
]

const errors = []

const checkExists = async (filePath) => {
  try {
    await access(filePath, constants.R_OK)
  } catch {
    errors.push(`Missing required file: ${filePath}`)
  }
}

const checkContains = async ({ path, includes }) => {
  try {
    const contents = await readFile(path, 'utf-8')
    includes.forEach((snippet) => {
      if (!contents.includes(snippet)) {
        errors.push(`Expected "${snippet}" in ${path}`)
      }
    })
  } catch {
    errors.push(`Unable to read file: ${path}`)
  }
}

const run = async () => {
  await Promise.all(requiredFiles.map((file) => checkExists(file)))
  await Promise.all(contentChecks.map((check) => checkContains(check)))

  if (errors.length > 0) {
    console.error('Smoke tests failed:')
    errors.forEach((message) => console.error(`- ${message}`))
    process.exit(1)
  }

  console.log('Smoke tests passed.')
}

run()
