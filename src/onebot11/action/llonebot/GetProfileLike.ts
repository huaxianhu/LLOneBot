import { BaseAction, Schema } from '../BaseAction'
import { ActionName } from '../types'
import { selfInfo } from '@/common/globalVars'
import { Dict } from 'cosmokit'

interface Payload {
  isLikeMe: boolean | string
  start: number | string,
  count: number | string
}

interface Response {
  users: Dict[]
  nextStart: number
}

export class GetProfileLike extends BaseAction<Payload, Response> {
  actionName = ActionName.GetProfileLike
  payloadSchema = Schema.object({
    isLikeMe: Schema.union([String, Boolean]).default(true),
    start: Schema.union([Number, String]).default(0),
    count: Schema.union([Number, String]).default(20)
  })

  async _handle(payload: Payload) {
    const isLikeMe = payload.isLikeMe.toString() === 'true'
    const ret = (await this.ctx.ntUserApi.getProfileLike(
      selfInfo.uid, isLikeMe, +payload.start, +payload.count
    )).info
    const users = payload.isLikeMe ? ret.userLikeInfos[0].voteInfo.userInfos : ret.userLikeInfos[0].favoriteInfo.userInfos
    for (const item of users) {
      try {
        item.uin = Number(await this.ctx.ntUserApi.getUinByUid(item.uid)) || 0
      }catch (e) {
        item.uin = 0
        this.ctx.logger.error(`获取${payload.isLikeMe ? '我点赞的': '赞我的'}账号${item.uid}转换uin失败`, e)
      }
    }
    return {users, nextStart: ret.start}
  }
}
