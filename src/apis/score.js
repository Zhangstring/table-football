import request from '@/utils/request'

// 创建用户
export const updateScore = (data) => request({
  url: 'score/updateScore',
  method: 'post',
  data
})
