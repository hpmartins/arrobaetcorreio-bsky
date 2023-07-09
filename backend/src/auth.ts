import express from 'express'
import { verifyJwt, AuthRequiredError } from '@atproto/xrpc-server'
import { DidResolver } from '@atproto/did-resolver'
import jwt_decode, { JwtPayload } from "jwt-decode";

export const validateAuth = async (
  req: express.Request,
  serviceDid: string,
  didResolver: DidResolver,
): Promise<unknown> => {
  const { authorization = '' } = req.headers
  if (!authorization.startsWith('Bearer ')) {
    return undefined
  }
  const jwt = authorization.replace('Bearer ', '').trim()
  return verifyJwt(jwt, serviceDid, async (did: string) => {
    return didResolver.resolveAtprotoKey(did)
  })
}

export const validateAuthNoError = async (
  req: express.Request,
  serviceDid: string,
  didResolver: DidResolver,
): Promise<unknown> => {
  const { authorization = '' } = req.headers
  if (!authorization.startsWith('Bearer ')) {
    return undefined
  }
  const jwt = authorization.replace('Bearer ', '').trim()
  return verifyJwt(jwt, serviceDid, async (did: string) => {
    return didResolver.resolveAtprotoKey(did)
  })
}

export const validateAuthDecode = async (
  req: express.Request
): Promise<string | undefined> => {
  const { authorization = '' } = req.headers
  if (!authorization.startsWith('Bearer ')) {
    return undefined
  }
  const jwt = authorization.replace('Bearer ', '').trim()
  const decoded = jwt_decode<JwtPayload>(jwt || "") || null
  if (!decoded || !decoded.sub) {
    return undefined
  }
  return decoded.sub
}
