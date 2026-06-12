<template>
  <div class="posts-page">
    <div class="page-header">
      <h2>帖子管理</h2>
      <div class="header-actions">
        <el-select v-model="filterStatus" placeholder="状态筛选" size="default" style="width: 120px; margin-right: 12px;">
          <el-option label="全部" value="" />
          <el-option label="上架" value="1" />
          <el-option label="下架" value="0" />
        </el-select>
        <el-input v-model="searchKeyword" placeholder="搜索标题/内容" clearable style="width: 200px; margin-right: 12px;" />
        <el-button type="primary" @click="loadPosts">搜索</el-button>
      </div>
    </div>

    <el-table :data="posts" v-loading="loading" stripe>
      <el-table-column prop="_id" label="ID" width="120" show-overflow-tooltip />
      <el-table-column prop="authorName" label="发布者" width="100" />
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="categoryName" label="分类" width="100" />
      <el-table-column prop="price" label="价格" width="80" />
      <el-table-column prop="likes" label="点赞" width="70" align="center" />
      <el-table-column prop="comments" label="评论" width="70" align="center" />
      <el-table-column prop="status" label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="发布时间" width="160">
        <template #default="{ row }">
          {{ formatTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" link @click="toggleStatus(row)">
            {{ row.status === 1 ? '下架' : '上架' }}
          </el-button>
          <el-button type="danger" size="small" link @click="deletePost(row)">删除</el-button>
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
        @size-change="loadPosts"
        @current-change="loadPosts"
      />
    </div>

    <!-- 下架原因弹窗 -->
    <el-dialog v-model="showBlockDialog" title="下架帖子" width="400px">
      <el-input v-model="blockReason" type="textarea" :rows="3" placeholder="请输入下架原因（将展示给用户）" />
      <template #footer>
        <el-button @click="showBlockDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmBlock">确认下架</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const posts = ref([])
const loading = ref(false)
const filterStatus = ref('')
const searchKeyword = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const API_BASE = 'https://fc-mp-ae9bd108-da40-4ae6-923b-c3007dedec12.next.bspapp.com/merchant-api'

const request = (method, params = {}) => {
  return fetch(`${API_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, params })
  }).then(r => r.json())
}

const loadPosts = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (filterStatus.value !== '') params.status = Number(filterStatus.value)
    if (searchKeyword.value) params.keyword = searchKeyword.value

    const res = await request('getPosts', params)
    if (res.code === 0) {
      posts.value = res.data || []
      total.value = res.total || posts.value.length
    }
  } catch (e) {
    // 本地存储兜底
    let localPosts = JSON.parse(localStorage.getItem('local_posts') || '[]')
    if (filterStatus.value !== '') {
      localPosts = localPosts.filter(p => p.status == filterStatus.value)
    }
    if (searchKeyword.value) {
      localPosts = localPosts.filter(p =>
        p.title.includes(searchKeyword.value) || p.content.includes(searchKeyword.value)
      )
    }
    posts.value = localPosts
    total.value = localPosts.length
  }
  loading.value = false
}

const showBlockDialog = ref(false)
const blockReason = ref('')
const currentBlockPost = ref(null)

const toggleStatus = async (row) => {
  const newStatus = row.status === 1 ? 0 : 1

  // 商家下架，需要填写原因
  if (newStatus === 0) {
    currentBlockPost.value = row
    blockReason.value = ''
    showBlockDialog.value = true
    return
  }

  // 上架操作直接执行
  await doToggleStatus(row._id || row.id, 1)
  row.status = 1
  ElMessage.success('已上架')
}

const confirmBlock = async () => {
  if (!blockReason.value.trim()) {
    ElMessage.warning('请填写下架原因')
    return
  }
  if (currentBlockPost.value) {
    await doToggleStatus(currentBlockPost.value._id || currentBlockPost.value.id, 0, blockReason.value)
    currentBlockPost.value.status = 0
    currentBlockPost.value.blockedByAdmin = true
    currentBlockPost.value.blockReason = blockReason.value
  }
  showBlockDialog.value = false
  ElMessage.success('已下架')
}

const doToggleStatus = async (id, status, reason = '') => {
  try {
    const params = { id, status }
    if (status === 0 && reason) {
      params.blockedByAdmin = true
      params.blockReason = reason
    }
    await request('togglePostStatus', params)
  } catch (e) {
    // 本地
    let localPosts = JSON.parse(localStorage.getItem('local_posts') || '[]')
    const idx = localPosts.findIndex(p => (p._id || p.id) === id)
    if (idx >= 0) {
      localPosts[idx].status = status
      if (status === 0 && reason) {
        localPosts[idx].blockedByAdmin = true
        localPosts[idx].blockReason = reason
      }
    }
    localStorage.setItem('local_posts', JSON.stringify(localPosts))
  }
}

const deletePost = (row) => {
  ElMessageBox.confirm('确定要删除该帖子吗？删除后无法恢复', '确认删除', {
    type: 'warning'
  }).then(async () => {
    try {
      await request('deletePost', { id: row._id || row.id })
    } catch (e) {
      // 本地
      let localPosts = JSON.parse(localStorage.getItem('local_posts') || '[]')
      localPosts = localPosts.filter(p => (p._id || p.id) !== (row._id || row.id))
      localStorage.setItem('local_posts', JSON.stringify(localPosts))
    }
    posts.value = posts.value.filter(p => (p._id || p.id) !== (row._id || row.id))
    ElMessage.success('已删除')
  }).catch(() => {})
}

const formatTime = (isoString) => {
  if (!isoString) return '-'
  return new Date(isoString).toLocaleString('zh-CN')
}

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.posts-page { padding: 24px; }
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