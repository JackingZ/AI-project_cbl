// 统一校验：正则 + Element Plus 表单规则 + 必填文案，全项目复用，禁止各页重复写规则
export const REGEX = {
  phone: /^1[3-9]\d{9}$/,
  positiveNumber: /^\d+(\.\d{1,2})?$/
}

// 生成必填规则
export function required(message, trigger = 'blur') {
  return { required: true, message, trigger }
}

// 手机号校验规则
export const phoneRule = {
  validator: (rule, value, cb) => {
    if (value && !REGEX.phone.test(value)) return cb(new Error('请输入正确的手机号'))
    cb()
  },
  trigger: 'blur'
}

// 正数（金额/重量）校验规则
export const positiveNumberRule = {
  validator: (rule, value, cb) => {
    if (value !== '' && value != null && !REGEX.positiveNumber.test(String(value))) {
      return cb(new Error('请输入正数，最多两位小数'))
    }
    cb()
  },
  trigger: 'blur'
}

// 常用表单规则集合
export const rules = {
  username: [required('请输入用户名')],
  password: [required('请输入密码', 'blur')],
  customer: [required('请输入客户名称')],
  country: [required('请选择目的国', 'change')],
  channel: [required('请选择物流渠道', 'change')],
  weight: [required('请输入重量'), positiveNumberRule],
  amount: [required('请输入金额'), positiveNumberRule],
  phone: [required('请输入手机号'), phoneRule],
  name: [required('请输入姓名')],
  role: [required('请选择角色', 'change')]
}
