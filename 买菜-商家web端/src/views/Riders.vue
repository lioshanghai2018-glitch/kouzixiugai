<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getList, add, update, remove } from '../api/riders'
import { getList as getCommunities } from '../api/communities'

const loading = ref(false)
const riders = ref([])
const communities = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增骑手')
const form = ref({
  id: null,
  name: '',
  phone: '',
  password: '',
  communityIds: []
})
const formRef = ref(null)

const statusOptions = [
  { label: '在职', value: 'active' },
  { label: '离职', value: 'inactive' }
]

const riderStatusOptions = [
  { label: '在线', value: 'online' },
  { label: '休息', value: 'offline' }
]

const rules = {
  name: [{ required: true, message: '请输入骑手姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}

const statusMap = {
  active: { text: '在职', type: 'success' },
  inactive: { text: '离职', type: 'info' }
}

const riderStatusMap = {
  online: { text: '在线', type: 'success' },
  offline: { text: '休息', type: 'warning' }
}

const fetchRiders = async () => {
  loading.value = true
  try {
    const res = await getList()
    riders.value = res?.data || []
  } catch (e) {
    console.error('获取骑手列表失败:', e)
    ElMessage.error('获取骑手列表失败')
  } finally {
    loading.value = false
  }
}

const fetchCommunities = async () => {
  try {
    const res = await getCommunities()
    communities.value = res?.data || []
  } catch (e) {
    console.error('获取小区列表失败:', e)
  }
}

const openAddDialog = () => {
  form.value = { id: null, name: '', phone: '', password: '', communityIds: [] }
  dialogTitle.value = '新增骑手'
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  form.value = {
    id: row._id,
    name: row.name,
    phone: row.phone,
    password: '',
    communityIds: row.communityIds || []
  }
  dialogTitle.value = '编辑骑手'
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate()
  try {
    if (form.value.id) {
      await update(form.value.id, {
        name: form.value.name,
        phone: form.value.phone,
        communityIds: form.value.communityIds
      })
      ElMessage.success('修改成功')
    } else {
      await add({
        name: form.value.name,
        phone: form.value.phone,
        password: form.value.password || '123456',
        communityIds: form.value.communityIds
      })
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    fetchRiders()
  } catch (e) {
    if (e !== false) ElMessage.error('操作失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除骑手"${row.name}"吗？`, '提示', { type: 'warning' })
    await remove(row._id)
    ElMessage.success('删除成功')
    fetchRiders()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

const getCommunityNames = (ids) => {
  if (!ids || ids.length === 0) return '未分配'
  return ids.map(id => {
    const c = communities.value.find(c => c.code === id)
    return c ? c.name : id
  }).join('、')
}

const toggleRiderStatus = async (row) => {
  const newStatus = row.riderStatus === 'online' ? 'offline' : 'online'
  try {
    await update(row._id, { riderStatus: newStatus })
    row.riderStatus = newStatus
    ElMessage.success(`骑手已切换为${newStatus === 'online' ? '在线' : '休息'}状态`)
  } catch (e) {
    ElMessage.error('切换状态失败')
  }
}

onMounted(() => {
  fetchRiders()
  fetchCommunities()
})
</script>

<template>
  <div class="riders-page">
    <h2 class="page-title">骑手管理</h2>

    <el-card class="action-card">
      <el-button type="primary" @click="openAddDialog">新增骑手</el-button>
      <span style="margin-left: 16px; color: #666;">共 {{ riders.length }} 名骑手</span>
    </el-card>

    <el-card class="list-card">
      <el-table :data="riders" v-loading="loading" stripe>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="在职状态" width="80">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type" size="small">
              {{ statusMap[row.status]?.text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="在线状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="riderStatusMap[row.riderStatus]?.type || 'info'"
              size="small"
              @click="toggleRiderStatus(row)"
              style="cursor: pointer;"
            >
              {{ riderStatusMap[row.riderStatus]?.text || '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="配送区域" min-width="200">
          <template #default="{ row }">
            <span v-if="row.communityIds?.length">
              <el-tag
                v-for="code in row.communityIds"
                :key="code"
                size="small"
                style="margin-right: 4px;"
              >
                {{ communities.find(c => c.code === code)?.name || code }}
              </el-tag>
            </span>
            <span v-else style="color: #999;">未分配</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
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

      <el-empty v-if="riders.length === 0 && !loading" description="暂无骑手数据" />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="骑手姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入骑手姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="登录密码" prop="password" v-if="!form.id">
          <el-input v-model="form.password" placeholder="不填则默认 123456" show-password />
        </el-form-item>
        <el-form-item label="骑手状态" v-if="!form.id">
          <el-radio-group v-model="form.riderStatus">
            <el-radio label="online">在线</el-radio>
            <el-radio label="offline">休息</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="配送区域">
          <el-select v-model="form.communityIds" multiple placeholder="选择负责的小区" style="width: 100%;">
            <el-option
              v-for="c in communities"
              :key="c._id"
              :label="`${c.code} - ${c.name}`"
              :value="c.code"
            />
          </el-select>
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
.riders-page {
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