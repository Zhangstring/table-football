import request from '@/utils/request'

// 创建用户
export const addUser = (data) => request({
  url: 'user',
  method: 'post',
  data
})

// 更新用户
export const updateUser = (id, params) => request({
  url: `user/${id}`,
  method: 'put',
  params
})

// 获取用户列表
export const getUser = () => request({
  url: 'user',
  method: 'get'
})

// 删除用户
export const delUser = (id) => request({
  url: `user/${id}`,
  method: 'delete'
})
