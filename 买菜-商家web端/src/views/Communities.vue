<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getList, add, update, remove } from '../api/communities'

const loading = ref(false)
const communities = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增小区')
const form = ref({
  id: null,
  name: '',
  code: ''
})
const formRef = ref(null)

const rules = {
  name: [{ required: true, message: '请输入小区名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入小区编号', trigger: 'blur' },
    { pattern: /^[A-Z][0-9]$/, message: '编号格式：A1、B2 等', trigger: 'blur' }
  ]
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getList()
    communities.value = res?.data || []
  } catch (e) {
    console.error('获取小区列表失败:', e)
    ElMessage.error('获取小区列表失败')
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  form.value = { id: null, name: '', code: '' }
  dialogTitle.value = '新增小区'
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  form.value = { id: row._id, name: row.name, code: row.code }
  dialogTitle.value = '编辑小区'
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate()
  try {
    if (form.value.id) {
      await update(form.value.id, { name: form.value.name, code: form.value.code })
      ElMessage.success('修改成功')
    } else {
      await add({ name: form.value.name, code: form.value.code })
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (e) {
    if (e !== false) ElMessage.error('操作失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除小区"${row.name}"吗？`, '提示', { type: 'warning' })
    await remove(row._id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="communities-page">
    <h2 class="page-title">小区管理</h2>

    <el-card class="action-card">
      <el-button type="primary" @click="openAddDialog">新增小区</el-button>
      <span style="margin-left: 16px; color: #666;">共 {{ communities.length }} 个小区</span>
    </el-card>

    <el-card class="list-card">
      <el-table :data="communities" v-loading="loading" stripe>
        <el-table-column prop="code" label="小区编号" width="120">
          <template #default="{ row }">
            <el-tag type="success">{{ row.code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="小区名称" />
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ row.createTime ? new Date(row.createTime).toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="communities.length === 0 && !loading" description="暂无小区数据" />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="450px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="小区编号" prop="code">
          <el-input v-model="form.code" placeholder="如：A1、B2" maxlength="2" />
        </el-form-item>
        <el-form-item label="小区名称" prop="name">
          <el-input v-model="form.name" placeholder="如：阳光小区" />
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
.communities-page {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
}
.page-title {
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
}
.action-card {
  margin-bottom: 16px;
}
.list-card {
  margin-bottom: 20px;
}
</style>