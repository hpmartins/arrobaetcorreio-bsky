import dotenv from 'dotenv'
import Wolfgang from './server'

const run = async () => {
  dotenv.config()
  const hostname = maybeStr(process.env.SERVER_HOSTNAME) ?? 'example.com'
  const server = await Wolfgang.create({
    port: maybeInt(process.env.SERVER_PORT) ?? 3009,
    listenhost: maybeStr(process.env.SERVER_LISTENHOST) ?? 'localhost',
    bskyIdentifier: maybeStr(process.env.SERVER_BSKY_IDENTIFIER) ?? '',
    bskyPassword: maybeStr(process.env.SERVER_BSKY_PASSWORD) ?? '',
    mysqlDatabase: maybeStr(process.env.SERVER_MYSQL_DATABASE) ?? 'bsky',
    mysqlHost: maybeStr(process.env.SERVER_MYSQL_HOST) ?? 'localhost',
    mysqlPort: maybeInt(process.env.SERVER_MYSQL_PORT) ?? 3306,
    mysqlUser: maybeStr(process.env.SERVER_MYSQL_USER) ?? '',
    mysqlPassword: maybeStr(process.env.SERVER_MYSQL_PASSWORD) ?? '',
    hostname,
  })
  await server.start()
  console.log(
    `running Server at http://${server.cfg.listenhost}:${server.cfg.port}`,
  )
}

export const maybeStr = (val?: string) => {
  if (!val) return undefined
  return val
}

export const maybeInt = (val?: string) => {
  if (!val) return undefined
  const int = parseInt(val, 10)
  if (isNaN(int)) return undefined
  return int
}

run()
