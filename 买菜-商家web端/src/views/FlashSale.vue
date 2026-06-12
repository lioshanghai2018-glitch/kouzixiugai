<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { getFlashSale, saveFlashSale, getFlashSaleProducts, addFlashSaleProduct, updateFlashSaleProduct, deleteFlashSaleProduct } from '../api/flashSale'
import { getProducts, uploadImage } from '../api/products'

const loading = ref(false)
const productDialogVisible = ref(false)
const selectProductDialogVisible = ref(false)

// 特惠活动
const flashSale = ref(null)
const flashSaleForm = ref({
  id: null,
  name: '限时特惠活动',
  startTime: new Date(),
  endTime: new Date(Date.now() + 86400000 * 7),
  status: true
})

// 特惠商品列表
const flashSaleProducts = ref([])
const productLoading = ref(false)

// 添加/编辑商品表单
const productForm = ref({
  id: null,
  name: '',
  image: '',
  originalPrice: 0,
  flashPrice: 0,
  stock: 99,
  specs: [{ name: '默认', price: 0, stock: 99 }]
})
const productFormRef = ref(null)

// 商品库
const productLibrary = ref([])
const selectedProductIds = ref([])

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }]
}

// 计算活动状态
const saleStatus = computed(() => {
  if (!flashSale.value) return '未设置'
  const now = Date.now()
  if (!flashSale.value.status) return '已禁用'
  if (now < flashSale.value.startTime) return '未开始'
  if (now > flashSale.value.endTime) return '已结束'
  return '进行中'
})

const extractData = (res) => {
  let data = res?.data
  // 如果 data 是数组，直接返回
  if (Array.isArray(data)) return data
  // 如果 data 是对象，取 data.data
  if (data && !Array.isArray(data)) {
    if (Array.isArray(data.data)) return data.data
    // 单个对象（如 getFlashSale 返回）
    if (data._id || data.id) return data
    return null
  }
  return null
}

// 加载特惠活动
const fetchFlashSale = async () => {
  try {
    const res = await getFlashSale()
    console.log('getFlashSale 响应:', res)
    console.log('res.data:', res?.data)
    const data = extractData(res)
    console.log('extractData 结果:', data)
    // getFlashSale 返回数组（按 startTime desc）。优先选有商品的（用户持续用的那个），
    // 其次选进行中的，最后才用最新创建的（避免历史空活动覆盖有数据的）
    const saleList = Array.isArray(data) ? data : (data ? [data] : [])
    const now = Date.now()
    const first = saleList.find(s => (s.products || []).length > 0)
      || saleList.find(s => s.status === true && s.startTime <= now && s.endTime > now)
      || saleList[0]
      || null
    if (first) {
      flashSale.value = first
      flashSaleForm.value = {
        id: first._id,
        name: first.name || '限时特惠活动',
        startTime: new Date(first.startTime),
        endTime: new Date(first.endTime),
        status: first.status
      }
    } else {
      flashSale.value = null
      flashSaleForm.value = {
        id: null,
        name: '限时特惠活动',
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000 * 7),
        status: true
      }
    }
    console.log('flashSale.value:', flashSale.value)
  } catch (e) {
    console.error('获取特惠活动失败:', e)
    flashSale.value = null
  }
}

// 保存特惠活动
const saveFlashSaleData = async () => {
  try {
    const res = await saveFlashSale({
      id: flashSaleForm.value.id,
      name: flashSaleForm.value.name,
      startTime: flashSaleForm.value.startTime.getTime(),
      endTime: flashSaleForm.value.endTime.getTime(),
      status: flashSaleForm.value.status
    })
    console.log('保存响应:', res)
    if (res?.data?.code !== 0) {
      ElMessage.error(res?.data?.msg || '保存失败')
      return
    }
    ElMessage.success('保存成功')
    // 直接更新 flashSale.value
    flashSale.value = {
      _id: res.data?.data?.id || res.data?.data?._id || flashSaleForm.value.id,
      name: flashSaleForm.value.name,
      startTime: flashSaleForm.value.startTime.getTime(),
      endTime: flashSaleForm.value.endTime.getTime(),
      status: flashSaleForm.value.status
    }
    flashSaleForm.value.id = flashSale.value._id
    fetchFlashSaleProducts()
  } catch (e) {
    console.error('保存失败:', e)
    ElMessage.error('保存失败: ' + (e.message || '请检查云函数'))
  }
}

// 加载特惠商品
const fetchFlashSaleProducts = async () => {
  productLoading.value = true
  try {
    const params = flashSale.value ? { flashSaleId: flashSale.value._id } : {}
    const res = await getFlashSaleProducts(params)
    flashSaleProducts.value = extractData(res) || []
  } catch (e) {
    console.error('获取特惠商品失败:', e)
  } finally {
    productLoading.value = false
  }
}

// 打开添加商品弹窗
const openAddProductDialog = () => {
  productForm.value = {
    id: null,
    name: '',
    image: '',
    originalPrice: 0,
    flashPrice: 0,
    stock: 99,
    specs: [{ name: '默认', price: 0, originalPrice: 0, stock: 99 }]
  }
  productDialogVisible.value = true
}

// 打开编辑商品弹窗
const openEditProductDialog = (row) => {
  productForm.value = {
    id: row._id,
    name: row.name || '',
    image: row.image || '',
    originalPrice: row.originalPrice || 0,
    flashPrice: row.flashPrice || 0,
    stock: row.stock || 0,
    specs: row.specs?.length
      ? row.specs.map(s => ({ name: s.name || '', price: s.price || 0, originalPrice: s.originalPrice || 0, stock: s.stock || 0 }))
      : [{ name: '默认', price: 0, originalPrice: 0, stock: 99 }]
  }
  productDialogVisible.value = true
}

// 保存商品
const saveProduct = async () => {
  if (!flashSale.value) {
    ElMessage.warning('请先保存特惠活动')
    return
  }

  try {
    // 顶层价格/库存由规格自动填充（避免重复录入）
    const firstSpec = productForm.value.specs.find(s => s.name) || {}
    const data = {
      flashSaleId: flashSale.value._id,
      name: productForm.value.name,
      image: productForm.value.image,
      originalPrice: productForm.value.originalPrice || firstSpec.originalPrice || firstSpec.price || 0,
      flashPrice: productForm.value.flashPrice || firstSpec.price || 0,
      stock: productForm.value.stock || firstSpec.stock || 0,
      specs: productForm.value.specs.filter(s => s.name)
    }

    if (productForm.value.id) {
      await updateFlashSaleProduct(productForm.value.id, data)
      ElMessage.success('更新成功')
    } else {
      const res = await addFlashSaleProduct(data)
      if (res?.data?.code !== 0) {
        ElMessage.error(res?.data?.msg || '添加失败')
        return
      }
      ElMessage.success('添加成功')
    }
    productDialogVisible.value = false
    fetchFlashSaleProducts()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

// 删除商品
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该商品吗？', '提示', { type: 'warning' })
    await deleteFlashSaleProduct(row._id)
    ElMessage.success('删除成功')
    fetchFlashSaleProducts()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

// 从商品库选择
const openSelectProductDialog = async () => {
  if (!flashSale.value) {
    ElMessage.warning('请先保存特惠活动')
    return
  }
  try {
    loading.value = true
    const res = await getProducts()
    console.log('商品库原始数据:', res)
    const data = extractData(res)
    console.log('解析后数据:', data)
    productLibrary.value = data || []
    selectedProductIds.value = []
    if (productLibrary.value.length === 0) {
      ElMessage.warning('商品库为空，请先添加商品')
    }
    selectProductDialogVisible.value = true
  } catch (e) {
    console.error('获取商品库失败:', e)
    ElMessage.error('获取商品库失败: ' + e.message)
  } finally {
    loading.value = false
  }
}

// 添加选中的商品
const addSelectedProducts = async () => {
  if (selectedProductIds.value.length === 0) {
    ElMessage.warning('请选择商品')
    return
  }
  try {
    let failCount = 0
    for (const productId of selectedProductIds.value) {
      const product = productLibrary.value.find(p => p._id === productId)
      if (product) {
        const res = await addFlashSaleProduct({
          flashSaleId: flashSale.value._id,
          name: product.name,
          image: product.images?.[0] || '',
          originalPrice: product.specs?.[0]?.price || 0,
          flashPrice: product.specs?.[0]?.price || 0,
          stock: product.specs?.[0]?.stock || 99,
          specs: (product.specs || []).map(s => ({ ...s, originalPrice: s.originalPrice || s.price || 0 }))
        })
        if (res?.data?.code !== 0) failCount++
      }
    }
    if (failCount > 0) {
      ElMessage.warning(`已添加，${failCount} 个失败`)
    } else {
      ElMessage.success('添加成功')
    }
    selectProductDialogVisible.value = false
    fetchFlashSaleProducts()
  } catch (e) {
    ElMessage.error('添加失败')
  }
}

// 上传图片到云存储
const beforeImageUpload = (file) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    ElMessage.warning('只支持 JPG/PNG/WebP 格式')
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片不能超过 5MB')
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
    const cloudPath = `merchant/flashsale/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`
    const res = await uploadImage(base64, cloudPath)
    if (res.data?.code === 0 && res.data?.data?.fileID) {
      productForm.value.image = res.data.data.fileID
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

// 规格管理
const addSpec = () => {
  productForm.value.specs.push({ name: '', price: 0, originalPrice: 0, stock: 99 })
}

const removeSpec = (index) => {
  if (productForm.value.specs.length > 1) {
    productForm.value.specs.splice(index, 1)
  }
}

onMounted(async () => {
  // 必须先拿到 flashSale.value._id 再查商品（之前并发调用导致 flashSaleId 传空）
  await fetchFlashSale()
  await fetchFlashSaleProducts()
})
</script>

<template>
  <div class="flash-sale">
    <h2 class="page-title">特惠管理</h2>

    <!-- 活动设置 -->
    <el-card class="sale-card">
      <template #header>
        <div class="card-header">
          <span>活动设置</span>
          <el-tag :type="saleStatus === '进行中' ? 'success' : saleStatus === '已结束' ? 'info' : 'warning'">
            {{ saleStatus }}
          </el-tag>
        </div>
      </template>
      <el-form :model="flashSaleForm" label-width="120px">
        <el-form-item label="活动名称">
          <el-input v-model="flashSaleForm.name" placeholder="请输入活动名称" style="width: 300px;" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="flashSaleForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 220px;"
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker
            v-model="flashSaleForm.endTime"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 220px;"
            :disabled-date="(date) => date.getTime() < flashSaleForm.startTime.getTime()"
          />
        </el-form-item>
        <el-form-item label="启用活动">
          <el-switch v-model="flashSaleForm.status" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveFlashSaleData">保存活动设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 特惠商品列表 -->
    <el-card class="sale-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>特惠商品</span>
          <div>
            <el-button type="primary" size="small" @click="openSelectProductDialog">从商品库添加</el-button>
            <el-button type="success" size="small" @click="openAddProductDialog">新增商品</el-button>
          </div>
        </div>
      </template>

      <el-table :data="flashSaleProducts" v-loading="productLoading" stripe>
        <el-table-column prop="name" label="商品名称" min-width="150" />
        <el-table-column label="图片" width="80">
          <template #default="{ row }">
            <el-image v-if="row.image" :src="row.image" style="width: 50px; height: 50px;" fit="cover" />
            <span v-else style="color: #999;">无图</span>
          </template>
        </el-table-column>
        <el-table-column label="原价" width="100">
          <template #default="{ row }">
            ¥{{ row.originalPrice }}
          </template>
        </el-table-column>
        <el-table-column label="特惠价" width="100">
          <template #default="{ row }">
            <span style="color: #ff4d4f; font-weight: bold;">¥{{ row.flashPrice }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库存" width="80">
          <template #default="{ row }">
            {{ row.stock }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditProductDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="flashSaleProducts.length === 0 && !productLoading" description="暂无特惠商品" />
    </el-card>

    <!-- 添加/编辑商品弹窗 -->
    <el-dialog v-model="productDialogVisible" :title="productForm.id ? '编辑商品' : '添加商品'" width="600px">
      <el-form :model="productForm" :rules="rules" ref="productFormRef" label-width="100px">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="productForm.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品图片">
          <div class="flash-image-row">
            <div v-if="productForm.image" class="flash-image-item">
              <el-image :src="productForm.image" fit="cover" class="flash-image-preview" />
              <el-button type="danger" circle size="small" @click="productForm.image = ''" class="flash-remove-btn">×</el-button>
            </div>
            <el-upload
              v-if="!productForm.image"
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
          <div class="upload-tip">点击 + 添加图片，单张不超过 5MB</div>
        </el-form-item>
        <el-form-item label="规格">
          <div v-for="(spec, index) in productForm.specs" :key="index" class="spec-row">
            <div class="spec-field">
              <span class="spec-label">规格名称</span>
              <el-input v-model="spec.name" placeholder="如 500g" style="width: 140px;" />
            </div>
            <div class="spec-field">
              <span class="spec-label">价格</span>
              <el-input-number v-model="spec.price" :min="0" :precision="2" style="width: 140px;" />
            </div>
            <div class="spec-field">
              <span class="spec-label">原价</span>
              <el-input-number v-model="spec.originalPrice" :min="0" :precision="2" style="width: 140px;" />
            </div>
            <div class="spec-field">
              <span class="spec-label">库存</span>
              <el-input-number v-model="spec.stock" :min="0" style="width: 140px;" />
            </div>
            <el-button v-if="productForm.specs.length > 1" type="danger" link @click="removeSpec(index)">删除</el-button>
          </div>
          <el-button type="primary" link @click="addSpec">+ 添加规格</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="productDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProduct">确定</el-button>
      </template>
    </el-dialog>

    <!-- 从商品库选择弹窗 -->
    <el-dialog v-model="selectProductDialogVisible" title="从商品库选择" width="700px">
      <el-table :data="productLibrary" @selection-change="(val) => selectedProductIds = val.map(p => p._id)">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="商品名称" />
        <el-table-column label="分类" width="100">
          <template #default="{ row }">
            {{ row.categoryName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="价格" width="100">
          <template #default="{ row }">
            ¥{{ row.specs?.[0]?.price || 0 }}
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="selectProductDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addSelectedProducts">添加选中 ({{ selectedProductIds.length }})</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.flash-sale {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
}
.page-title {
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
}
.sale-card {
  max-width: 900px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.spec-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: flex-end;
  margin-bottom: 14px;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fafafa;
}
.spec-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.flash-image-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.flash-image-item {
  position: relative;
  width: 100px;
  height: 100px;
}
.flash-image-preview {
  width: 100px;
  height: 100px;
  border-radius: 6px;
}
.flash-remove-btn {
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
.upload-tip {
  color: #999;
  font-size: 12px;
  margin-top: 8px;
}
.spec-label {
  font-size: 12px;
  color: #909399;
  line-height: 1;
}
</style>
