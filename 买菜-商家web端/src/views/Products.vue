<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { getProducts, addProduct, updateProduct, deleteProduct, fixProductCategories, diagnoseCategories, debugCategoryPage, uploadImage } from '../api/products'
import { getList as getCategories } from '../api/categories'
import * as XLSX from 'xlsx'

const tableData = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加商品')
const formRef = ref(null)
const categories = ref([])
const uploadLoading = ref(false)

// 筛选条件
const filterCategory = ref('')
const filterStatus = ref('')

const formData = ref({
  id: null,
  name: '',
  categoryId: '',
  categoryName: '',
  description: '',
  specs: [{ name: '', price: 0, stock: 0 }],
  images: [],
  status: true,
  sort: 0
})

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

const filteredData = computed(() => {
  let data = tableData.value
  if (filterCategory.value) {
    data = data.filter(item => item.categoryId === filterCategory.value)
  }
  if (filterStatus.value !== '') {
    data = data.filter(item => item.status === (filterStatus.value === 'true'))
  }
  return data
})

const extractList = (res) => {
  let data = res?.data
  if (data && !Array.isArray(data)) {
    if (Array.isArray(data.data)) {
      return data.data
    }
    return null
  }
  return Array.isArray(data) ? data : null
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getProducts()
    console.log('getProducts 响应:', res)
    const list = extractList(res)
    tableData.value = list || []
  } catch (e) {
    console.error('获取商品列表失败:', e)
    ElMessage.error('获取商品列表失败')
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const res = await getCategories()
    const list = extractList(res)
    categories.value = list ? list.filter(c => c.name && c.status !== false) : []
  } catch (e) {
    console.error('获取分类失败:', e)
  }
}

const openAddDialog = () => {
  dialogTitle.value = '添加商品'
  formData.value = {
    id: null,
    name: '',
    categoryId: '',
    categoryName: '',
    description: '',
    specs: [{ name: '', price: 0, stock: 0 }],
    images: [],
    status: true,
    sort: 0
  }
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  dialogTitle.value = '编辑商品'
  formData.value = {
    id: row._id,
    name: row.name || '',
    categoryId: row.categoryId || '',
    categoryName: row.categoryName || '',
    description: row.description || '',
    specs: row.specs?.length ? row.specs.map(s => ({...s})) : [{ name: '', price: 0, stock: 0 }],
    images: row.images || [],
    status: row.status !== false,
    sort: row.sort || 0
  }
  dialogVisible.value = true
}

const handleCategoryChange = (categoryId) => {
  const category = categories.value.find(c => c._id === categoryId)
  formData.value.categoryName = category?.name || ''
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  // 过滤空规格
  const validSpecs = formData.value.specs.filter(s => s.name && s.price > 0)
  if (validSpecs.length === 0) {
    ElMessage.warning('请至少添加一个有效的规格（名称和价格必填）')
    return
  }
  if (validSpecs.length === 0) {
    ElMessage.warning('请至少添加一个有效的规格')
    return
  }

  const submitData = {
    ...formData.value,
    specs: validSpecs
  }

  try {
    let res
    if (formData.value.id) {
      res = await updateProduct(formData.value.id, submitData)
    } else {
      res = await addProduct(submitData)
    }
    console.log('提交响应:', res)
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
    await ElMessageBox.confirm('确定删除该商品吗？', '提示', { type: 'warning' })
    await deleteProduct(row._id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

const handleStatusChange = async (row, newStatus) => {
  try {
    await updateProduct(row._id, { status: newStatus })
    ElMessage.success('状态更新成功')
    fetchList()
  } catch (e) {
    ElMessage.error('状态更新失败')
  }
}

// 更新商品排序
const updateSort = async (row) => {
  try {
    await updateProduct(row._id, { sort: row.sort })
    // 不需要刷新列表，只更新本地数据
  } catch (e) {
    ElMessage.error('排序更新失败')
    fetchList() // 失败时刷新恢复原值
  }
}

// 修正商品分类数据
const fixCategories = async () => {
  try {
    await ElMessageBox.confirm('此操作将修正所有商品的分类名称，使其与分类ID一致。是否继续？', '提示', { type: 'warning' })
    loading.value = true
    const res = await fixProductCategories()
    ElMessage.success(res?.data?.msg || '修正完成')
    fetchList()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('修正失败')
  } finally {
    loading.value = false
  }
}

// 诊断数据
const diagnosisData = ref({ categories: [], products: [] })
const diagnosisVisible = ref(false)

const showDiagnosis = async () => {
  try {
    loading.value = true
    const res = await diagnoseCategories()
    const data = res?.data?.data || res?.data
    if (data) {
      diagnosisData.value = data
      diagnosisVisible.value = true
    } else {
      ElMessage.warning('获取诊断数据失败')
    }
  } catch (e) {
    ElMessage.error('诊断失败')
  } finally {
    loading.value = false
  }
}

// 调试数据
const debugData = ref({})
const debugVisible = ref(false)

const showDebug = async () => {
  try {
    loading.value = true
    const res = await debugCategoryPage()
    console.log('调试数据:', res)
    debugData.value = res?.data?.data || res?.data || {}
    debugVisible.value = true
  } catch (e) {
    ElMessage.error('调试失败')
    console.error('调试失败:', e)
  } finally {
    loading.value = false
  }
}

// 规格管理
const addSpec = () => {
  formData.value.specs.push({ name: '', price: 0, stock: 0 })
}

const removeSpec = (index) => {
  if (formData.value.specs.length > 1) {
    formData.value.specs.splice(index, 1)
  }
}

// 图片管理
const removeImage = (index) => {
  formData.value.images.splice(index, 1)
}

const beforeImageUpload = (file) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    ElMessage.warning('只支持 JPG/PNG/WebP 格式')
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片不能超过 5MB')
    return false
  }
  if (formData.value.images.length >= 9) {
    ElMessage.warning('最多 9 张')
    return false
  }
  return true
}

const customUpload = async ({ file }) => {
  const loading = ElLoading.service({ text: '上传中...' })
  try {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const cloudPath = `merchant/product/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`
    const res = await uploadImage(base64, cloudPath)
    if (res.data?.code === 0 && res.data?.data?.fileID) {
      formData.value.images.push(res.data.data.fileID)
      ElMessage.success('上传成功')
    } else {
      ElMessage.error(res.data?.msg || '上传失败')
    }
  } catch (e) {
    ElMessage.error('上传失败: ' + (e.message || e))
  } finally {
    loading.close()
  }
}

// ========== 批量导入导出 ==========

// 导出Excel - 每个规格单独一行
const exportExcel = () => {
  const exportData = []
  tableData.value.forEach(item => {
    item.specs?.forEach((spec, idx) => {
      exportData.push({
        '商品名称': idx === 0 ? (item.name || '') : '',
        '分类': idx === 0 ? (item.categoryName || '') : '',
        '描述': idx === 0 ? (item.description || '') : '',
        '规格名称': spec.name || '',
        '价格': spec.price || 0,
        '库存': spec.stock ?? 0,
        '图片URL': idx === 0 ? (item.images?.join(';') || '') : '',
        '排序': idx === 0 ? (item.sort || 0) : '',
        '状态': idx === 0 ? (item.status ? '上架' : '下架') : ''
      })
    })
    if (!item.specs?.length) {
      exportData.push({
        '商品名称': item.name || '',
        '分类': item.categoryName || '',
        '描述': item.description || '',
        '规格名称': '',
        '价格': 0,
        '库存': 0,
        '图片URL': item.images?.join(';') || '',
        '排序': item.sort || 0,
        '状态': item.status ? '上架' : '下架'
      })
    }
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(exportData)
  XLSX.utils.book_append_sheet(wb, ws, '商品列表')

  ws['!cols'] = [
    { wch: 20 }, // 商品名称
    { wch: 10 }, // 分类
    { wch: 30 }, // 描述
    { wch: 12 }, // 规格名称
    { wch: 10 }, // 价格
    { wch: 10 }, // 库存
    { wch: 50 }, // 图片URL
    { wch: 10 }, // 排序
    { wch: 10 }  // 状态
  ]

  const fileName = `商品列表_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
  ElMessage.success('导出成功')
}

// 导入Excel
const importExcel = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xlsx,.xls'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        loading.value = true
        const data = new Uint8Array(evt.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet)

        if (jsonData.length === 0) {
          ElMessage.warning('导入文件为空')
          return
        }

        // 按商品名称分组
        const productMap = new Map()
        jsonData.forEach(row => {
          const name = row['商品名称']
          if (!name) return  // 跳过空名称行

          if (!productMap.has(name)) {
            const categoryName = row['分类'] || ''
            const category = categories.value.find(c => c.name === categoryName)
            productMap.set(name, {
              name: name,
              categoryId: category?._id || '',
              categoryName: categoryName,
              description: row['描述'] || '',
              specs: [],
              images: (row['图片URL'] || '').split(';').filter(s => s.trim()),
              sort: parseInt(row['排序']) || 0,
              status: row['状态'] === '上架'
            })
          }

          // 添加规格（含库存）
          const specName = row['规格名称']
          const price = parseFloat(row['价格']) || 0
          const stock = parseInt(row['库存']) || 0
          if (specName) {
            productMap.get(name).specs.push({ name: specName, price, stock })
          }
        })

        if (productMap.size === 0) {
          ElMessage.warning('没有找到有效的商品数据')
          return
        }

        // 混合模式：按名称匹配
        let addCount = 0
        let updateCount = 0
        let skipCount = 0

        for (const product of productMap.values()) {
          // 确保至少有1个规格
          if (product.specs.length === 0) {
            product.specs.push({ name: '默认', price: 0 })
          }

          const existItem = tableData.value.find(t => t.name === product.name)
          if (existItem) {
            try {
              await updateProduct(existItem._id, product)
              updateCount++
            } catch (e) {
              console.error('更新失败:', e)
              skipCount++
            }
          } else {
            try {
              await addProduct(product)
              addCount++
            } catch (e) {
              console.error('添加失败:', e)
              skipCount++
            }
          }
        }

        ElMessage.success(`导入完成：新增${addCount}条，更新${updateCount}条，跳过${skipCount}条`)
        fetchList()
      } catch (error) {
        console.error('导入失败:', error)
        ElMessage.error('导入失败：' + error.message)
      } finally {
        loading.value = false
      }
    }
    reader.readAsArrayBuffer(file)
  }
  input.click()
}

onMounted(() => {
  fetchList()
  fetchCategories()
})
</script>

<template>
  <div class="products">
    <h2 class="page-title">商品管理</h2>

    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="openAddDialog">+ 添加商品</el-button>
        <el-button @click="importExcel">批量导入</el-button>
        <el-button @click="exportExcel">批量导出</el-button>
        <el-button type="warning" @click="fixCategories">修正分类</el-button>
        <el-button type="info" @click="showDiagnosis">诊断数据</el-button>
        <el-button type="success" @click="showDebug">调试</el-button>
      </div>
      <div class="filters">
        <el-select v-model="filterCategory" placeholder="按分类筛选" clearable style="width: 150px; margin-right: 10px;">
          <el-option v-for="cat in categories" :key="cat._id" :label="cat.name" :value="cat._id" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="上下架状态" clearable style="width: 120px;">
          <el-option label="上架" value="true" />
          <el-option label="下架" value="false" />
        </el-select>
      </div>
    </div>

    <el-table :data="filteredData" v-loading="loading" stripe>
      <el-table-column label="排序" width="110">
        <template #default="{ row }">
          <el-input-number
            v-model="row.sort"
            :min="0"
            size="small"
            controls-position="right"
            style="width: 90px;"
            @change="updateSort(row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="name" label="商品名称" min-width="150" />
      <el-table-column prop="categoryName" label="分类" width="100" />
      <el-table-column label="价格" width="150">
        <template #default="{ row }">
          <span v-if="row.specs?.length">
            <span v-for="(spec, idx) in row.specs.slice(0, 2)" :key="idx" style="margin-right: 5px;">
              {{ spec.name }}: ¥{{ spec.price }}
            </span>
            <span v-if="row.specs.length > 2" style="color: #999; font-size: 12px;">+{{ row.specs.length - 2 }}</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="图片" width="120">
        <template #default="{ row }">
          <div v-if="row.images?.length" class="image-list">
            <el-image
              v-for="(img, idx) in row.images.slice(0, 3)"
              :key="idx"
              :src="img"
              style="width: 40px; height: 40px; margin-right: 4px;"
              fit="cover"
            />
            <span v-if="row.images.length > 3" style="color: #999;">+{{ row.images.length - 3 }}</span>
          </div>
          <span v-else style="color: #999;">无图</span>
        </template>
      </el-table-column>
      <el-table-column label="库存" width="120">
        <template #default="{ row }">
          <span v-if="row.specs?.length">
            <span v-for="(spec, idx) in row.specs.slice(0, 2)" :key="idx" style="margin-right: 8px; font-size: 12px;">
              {{ spec.name }}: {{ spec.stock ?? 0 }}
            </span>
            <span v-if="row.specs.length > 2" style="color: #999;">+{{ row.specs.length - 2 }}</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status ? 'success' : 'info'">{{ row.status ? '上架' : '下架' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-popconfirm title="确定删除该商品吗？" @confirm="handleDelete(row)">
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入商品名称" />
        </el-form-item>

        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="formData.categoryId" placeholder="请选择分类" @change="handleCategoryChange" style="width: 100%;">
            <el-option v-for="cat in categories" :key="cat._id" :label="cat.name" :value="cat._id" />
          </el-select>
        </el-form-item>

        <el-form-item label="商品图片">
          <div class="image-grid">
            <div v-for="(url, index) in formData.images" :key="index" class="image-item">
              <el-image :src="url" fit="cover" class="image-preview" />
              <el-button type="danger" circle size="small" @click="removeImage(index)" class="remove-btn">×</el-button>
            </div>
            <el-upload
              v-if="formData.images.length < 9"
              :show-file-list="false"
              :http-request="customUpload"
              :before-upload="beforeImageUpload"
              accept="image/jpeg,image/png,image/webp"
              class="upload-tile"
            >
              <div class="upload-placeholder">
                <span class="plus-icon">+</span>
                <span class="upload-text">添加图片</span>
              </div>
            </el-upload>
          </div>
          <div class="upload-tip">点击 + 添加图片，最多 9 张，单张不超过 5MB</div>
        </el-form-item>

        <el-form-item label="商品描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入商品描述" />
        </el-form-item>

        <el-form-item label="规格">
          <div class="specs-container">
            <div v-for="(spec, index) in formData.specs" :key="index" class="spec-row">
              <el-input v-model="spec.name" placeholder="规格名称，如：500g" style="width: 120px;" />
              <span style="margin: 0 8px;">价格</span>
              <el-input-number v-model="spec.price" :min="0" :precision="2" style="width: 100px;" />
              <span style="margin: 0 8px;">库存</span>
              <el-input-number v-model="spec.stock" :min="0" style="width: 100px;" />
              <el-button v-if="formData.specs.length > 1" type="danger" link @click="removeSpec(index)" style="margin-left: 8px;">删除</el-button>
            </div>
            <el-button type="primary" link @click="addSpec">+ 添加规格</el-button>
          </div>
        </el-form-item>

        <el-form-item label="排序号">
          <el-input-number v-model="formData.sort" :min="0" />
        </el-form-item>

        <el-form-item label="上下架">
          <el-switch v-model="formData.status" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 诊断弹窗 -->
    <el-dialog v-model="diagnosisVisible" title="分类数据诊断" width="900px">
      <el-tabs>
        <el-tab-pane label="商品列表">
          <el-table :data="diagnosisData.products" stripe size="small" max-height="400">
            <el-table-column prop="name" label="商品名称" min-width="120" />
            <el-table-column prop="categoryId" label="分类ID" width="180" show-overflow-tooltip />
            <el-table-column prop="categoryIdInMap" label="ID对应分类" width="100" />
            <el-table-column prop="categoryName" label="商品categoryName" width="120" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.isMatch === '✓' ? 'success' : 'danger'" size="small">{{ row.isMatch }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="分类列表">
          <el-table :data="diagnosisData.categories" stripe size="small">
            <el-table-column prop="_id" label="分类ID" width="200" show-overflow-tooltip />
            <el-table-column prop="name" label="分类名称" />
            <el-table-column prop="sort" label="排序" width="80" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 调试弹窗 -->
    <el-dialog v-model="debugVisible" title="分类页面调试" width="900px">
      <el-form label-width="200px">
        <el-form-item label="categories 数量">{{ debugData.categories?.length || 0 }}</el-form-item>
        <el-form-item label="products 数量">{{ debugData.products?.length || 0 }}</el-form-item>
        <el-form-item label="testResult">{{ debugData.testResult }}</el-form-item>
      </el-form>
      <h4>左侧分类（原始数据）</h4>
      <el-table :data="debugData.categories" stripe size="small" max-height="200">
        <el-table-column prop="_id" label="_id" width="220" show-overflow-tooltip />
        <el-table-column prop="name" label="name" />
      </el-table>
      <h4>商品列表（原始数据）</h4>
      <el-table :data="debugData.products" stripe size="small" max-height="300">
        <el-table-column prop="name" label="商品名称" width="100" />
        <el-table-column prop="categoryId" label="categoryId" width="220" show-overflow-tooltip />
        <el-table-column prop="categoryIdType" label="type" width="80" />
        <el-table-column prop="categoryName" label="categoryName" width="100" />
      </el-table>
    </el-dialog>
  </div>
</template>

<style scoped>
.products {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
}
.page-title {
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
}
.toolbar {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.toolbar-left {
  display: flex;
  gap: 10px;
}
.filters {
  display: flex;
  align-items: center;
}
.specs-container {
  width: 100%;
}
.spec-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.image-list {
  display: flex;
  align-items: center;
}
.upload-tip {
  color: #999;
  font-size: 12px;
  margin-top: 8px;
}
.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.image-item {
  position: relative;
  width: 100px;
  height: 100px;
}
.image-preview {
  width: 100px;
  height: 100px;
  border-radius: 6px;
}
.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  padding: 0;
  font-size: 14px;
}
.upload-tile {
  width: 100px;
  height: 100px;
}
.upload-placeholder {
  width: 100px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-sizing: border-box;
}
.upload-placeholder:hover {
  border-color: #4F9A42;
}
.plus-icon {
  font-size: 28px;
  color: #999;
  line-height: 1;
}
.upload-text {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
