<template>
  <div class="cert-page">
    <div class="page-header">
      <h2>认证管理</h2>
      <div class="header-actions">
        <el-select v-model="filterStatus" placeholder="状态筛选" size="default" style="width: 120px; margin-right: 12px;">
          <el-option label="全部" value="" />
          <el-option label="待审核" value="pending" />
          <el-option label="已认证" value="certified" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>
        <el-button type="primary" @click="loadCerts">搜索</el-button>
      </div>
    </div>

    <el-table :data="certs" v-loading="loading" stripe>
      <el-table-column prop="userId" label="用户ID" width="150" show-overflow-tooltip />
      <el-table-column prop="userName" label="用户名" width="120" />
      <el-table-column prop="idCardUrl" label="身份证" width="80">
        <template #default="{ row }">
          <el-button v-if="row.idCardUrl" type="primary" size="small" link @click="previewImage(row.idCardUrl)">查看</el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="billUrl" label="地址证明" width="80">
        <template #default="{ row }">
          <el-button v-if="row.billUrl" type="primary" size="small" link @click="previewImage(row.billUrl)">查看</el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="communityName" label="认证小区" width="120" />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="submitTime" label="提交时间" width="160">
        <template #default="{ row }">
          {{ formatTime(row.submitTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="certTime" label="认证时间" width="160">
        <template #default="{ row }">
          {{ formatTime(row.certTime) || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 'pending'">
            <el-button type="success" size="small" link @click="approveCert(row)">通过</el-button>
            <el-button type="danger" size="small" link @click="rejectCert(row)">拒绝</el-button>
          </template>
          <template v-else-if="row.status === 'certified'">
            <el-button type="warning" size="small" link @click="revokeCert(row)">撤销</el-button>
          </template>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadCerts"
        @current-change="loadCerts"
      />
    </div>

    <!-- 图片预览弹窗 -->
    <el-dialog v-model="showImageDialog" title="图片预览" width="600px">
      <img v-if="previewUrl" :src="previewUrl" style="width: 100%;" />
    </el-dialog>

    <!-- 拒绝原因弹窗 -->
    <el-dialog v-model="showRejectDialog" title="拒绝原因" width="400px">
      <el-input v-model="rejectReason" type="textarea" :rows="4" placeholder="请输入拒绝原因" />
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const certs = ref([])
const loading = ref(false)
const filterStatus = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const showImageDialog = ref(false)
const previewUrl = ref('')
const showRejectDialog = ref(false)
const rejectReason = ref('')
const currentCert = ref(null)

const API_BASE = 'https://fc-mp-ae9bd108-da40-4ae6-923b-c3007dedec12.next.bspapp.com/merchant-api'

const request = (method, params = {}) => {
  return fetch(`${API_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, params })
  }).then(r => r.json())
}

const loadCerts = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (filterStatus.value) params.status = filterStatus.value

    const res = await request('getCerts', params)
    if (res.code === 0) {
      certs.value = res.data || []
      total.value = res.total || certs.value.length
    }
  } catch (e) {
    // 本地存储兜底
    const localCerts = JSON.parse(localStorage.getItem('local_certs') || '[]')
    let filtered = localCerts
    if (filterStatus.value) {
      filtered = localCerts.filter(c => c.status === filterStatus.value)
    }
    certs.value = filtered
    total.value = filtered.length
  }
  loading.value = false
}

const statusType = (status) => {
  const types = { pending: 'warning', certified: 'success', rejected: 'danger', none: 'info' }
  return types[status] || 'info'
}

const statusText = (status) => {
  const texts = { pending: '待审核', certified: '已认证', rejected: '已拒绝', none: '未认证' }
  return texts[status] || status
}

const formatTime = (isoString) => {
  if (!isoString) return ''
  return new Date(isoString).toLocaleString('zh-CN')
}

const previewImage = (url) => {
  previewUrl.value = url
  showImageDialog.value = true
}

const approveCert = async (row) => {
  try {
    await request('approveCert', { userId: row.userId })
  } catch (e) {
    // 本地
    let localCerts = JSON.parse(localStorage.getItem('local_certs') || '[]')
    const idx = localCerts.findIndex(c => c.userId === row.userId)
    if (idx >= 0) {
      localCerts[idx].status = 'certified'
      localCerts[idx].certTime = new Date().toISOString()
    } else {
      localCerts.push({ ...row, status: 'certified', certTime: new Date().toISOString() })
    }
    localStorage.setItem('local_certs', JSON.stringify(localCerts))
  }
  row.status = 'certified'
  row.certTime = new Date().toISOString()
  ElMessage.success('已通过认证')
}

const rejectCert = (row) => {
  currentCert.value = row
  rejectReason.value = ''
  showRejectDialog.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  try {
    await request('rejectCert', { userId: currentCert.value.userId, reason: rejectReason.value })
  } catch (e) {
    let localCerts = JSON.parse(localStorage.getItem('local_certs') || '[]')
    const idx = localCerts.findIndex(c => c.userId === currentCert.value.userId)
    if (idx >= 0) {
      localCerts[idx].status = 'rejected'
      localCerts[idx].rejectReason = rejectReason.value
    } else {
      localCerts.push({ ...currentCert.value, status: 'rejected', rejectReason: rejectReason.value })
    }
    localStorage.setItem('local_certs', JSON.stringify(localCerts))
  }
  currentCert.value.status = 'rejected'
  currentCert.value.rejectReason = rejectReason.value
  showRejectDialog.value = false
  ElMessage.success('已拒绝')
}

const revokeCert = async (row) => {
  ElMessageBox.confirm('确定要撤销该用户的认证资格吗？', '确认撤销', {
    type: 'warning'
  }).then(async () => {
    try {
      await request('revokeCert', { userId: row.userId })
    } catch (e) {
      let localCerts = JSON.parse(localStorage.getItem('local_certs') || '[]')
      const idx = localCerts.findIndex(c => c.userId === row.userId)
      if (idx >= 0) {
        localCerts[idx].status = 'none'
      }
      localStorage.setItem('local_certs', JSON.stringify(localCerts))
    }
    row.status = 'none'
    ElMessage.success('已撤销')
  }).catch(() => {})
}

onMounted(() => {
  loadCerts()
})
</script>

<style scoped>
.cert-page { padding: 24px; }
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-header h2 { margin: 0; font-size: 20px; }
.header-actions { display: flex; align-items: center; }
.pagination-wrap { margin-top: 24px; display: flex; justify-content: flex-end; }
</style>