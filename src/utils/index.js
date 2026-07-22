// ElMessageBox / ElMessage 由 unplugin-auto-import 按需自动引入（含样式），无需手动 import

// 统一删除/危险操作二次确认，页面禁止各自重复写 ElMessageBox
export function confirmAction(message = '确定执行该操作吗？', title = '提示') {
  return ElMessageBox.confirm(message, title, {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  })
}

// 删除确认 + 执行 + 成功提示，返回是否成功
export async function confirmDelete(handler, message = '删除后不可恢复，确定删除吗？') {
  try {
    await confirmAction(message, '删除确认')
  } catch {
    return false
  }
  await handler()
  ElMessage.success('删除成功')
  return true
}

// 通用二次确认 + 执行 + 成功提示（取消时静默返回，避免未捕获的 reject）
export async function confirmThen(message, handler, { title = '提示', success = '操作成功' } = {}) {
  try {
    await confirmAction(message, title)
  } catch {
    return false
  }
  await handler()
  if (success) ElMessage.success(success)
  return true
}
