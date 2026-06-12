<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getList, add, update, remove } from '../api/categories'

const tableData = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加分类')
const formData = ref({ id: null, name: '', sort: 0, status: true })
const formRef = ref(null)

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序号', trigger: 'blur' }]
}

// 从嵌套响应中提取数组
const extractList = (res) => {
  let data = res?.data
  // uniCloud URL化 可能在外层包 { errCode, data }
  if (data && !Array.isArray(data)) {
    // 如果 data 是 { code: 0, data: [...] }
    if (Array.isArray(data.data)) {
      return data.data
    }
    // 如果 data 直接有数组字段
    return null
  }
  return Array.isArray(data) ? data : null
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getList()
    console.log('getCategories 完整响应:', res)
    const list = extractList(res)
    console.log('解析后列表:', list)
    const filteredList = list ? list.filter(item => item && item.name) : []
    // 把数据库的 _id 转成 id
    tableData.value = filteredList.map(item => ({
      ...item,
      id: item._id
    }))
    console.log('tableData.value 长度:', tableData.value.length)
    if (!list) {
      console.warn('无法解析分类数据，原始响应:', JSON.stringify(res?.data))
    }
  } catch (e) {
    console.error('获取分类列表失败:', e)
    ElMessage.error('获取分类列表失败')
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  dialogTitle.value = '添加分类'
  formData.value = { id: null, name: '', sort: 0, status: true }
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  dialogTitle.value = '编辑分类'
  formData.value = {
    id: row._id,
    name: row.name,
    sort: row.sort,
    status: row.status
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  try {
    let res
    const submitData = { ...formData.value }
    console.log('提交数据:', submitData)
    if (formData.value.id) {
      res = await update(formData.value.id, submitData)
    } else {
      res = await add(submitData)
    }
    console.log('提交响应:', res)
    // uniCloud URL化可能包装返回：{ errCode, data } 或直接 { code, data }
    const innerData = res?.data?.data || res?.data
    const code = innerData?.code
    if (code === 0 || code === undefined) {
      ElMessage.success(formData.value.id ? '更新成功' : '添加成功')
      dialogVisible.value = false
      fetchList()
    } else {
      ElMessage.error(innerData?.msg || '操作失败')
    }
  } catch (e) {
    console.error('操作失败:', e)
    ElMessage.error('操作失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该分类吗？', '提示', { type: 'warning' })
    await remove(row._id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

const handleStatusChange = async (row, newStatus) => {
  try {
    await update(row.id, { status: newStatus })
    ElMessage.success('状态更新成功')
    fetchList()
  } catch (e) {
    ElMessage.error('状态更新失败')
  }
}

onMounted(fetchList)
</script>

<template>
  <div class="categories">
    <h2 class="page-title">分类管理</h2>
    <div class="toolbar">
      <el-button type="primary" @click="openAddDialog">+ 添加分类</el-button>
    </div>
    <el-table :data="tableData" v-loading="loading" stripe style="min-height: 200px;">
      <el-table-column prop="sort" label="排序号" width="120" />
      <el-table-column prop="name" label="分类名称" />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-switch :model-value="row.status" @change="(val) => handleStatusChange(row, val)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-popconfirm title="确定删除该分类吗？" @confirm="handleDelete(row)">
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="400px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="排序号" prop="sort">
          <el-input-number v-model="formData.sort" :min="1" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="formData.status" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.categories {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  min-height: 100%;
  box-sizing: border-box;
}
.page-title {
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
}
.toolbar {
  margin-bottom: 20px;
}
</style>