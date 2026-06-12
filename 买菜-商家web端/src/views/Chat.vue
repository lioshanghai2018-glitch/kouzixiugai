<template>
  <div class="chat-page">
    <div class="chat-header">
      <h3>客服消息</h3>
    </div>

    <div class="chat-container">
      <!-- 会话列表 -->
      <div class="conv-list">
        <div
          class="conv-item"
          :class="{ active: currentConv && currentConv._id === conv._id }"
          v-for="conv in conversations"
          :key="conv._id"
          @click="selectConv(conv)"
        >
          <div class="conv-avatar">{{ getAvatarText(conv.userName) }}</div>
          <div class="conv-content">
            <div class="conv-header">
              <span class="conv-name">{{ conv.userName }}</span>
              <span class="conv-time">{{ formatTime(conv.lastMessageTime) }}</span>
            </div>
            <div class="conv-footer">
              <span class="conv-last-msg">{{ conv.lastMessage || '暂无消息' }}</span>
              <el-badge :value="conv.unreadMerchant" :hidden="conv.unreadMerchant === 0" />
            </div>
          </div>
        </div>
        <div v-if="conversations.length === 0 && !loading" class="empty-hint">
          暂无消息
        </div>
      </div>

      <!-- 聊天窗口 -->
      <div class="chat-window">
        <div v-if="!currentConv" class="no-selection">
          <p>请选择会话</p>
        </div>
        <template v-else>
          <div class="chat-title">{{ currentConv.userName }}</div>
          <div class="message-list" ref="messageListRef">
            <div
              v-for="(msg, idx) in messages"
              :key="idx"
              class="message-item"
              :class="{ 'from-me': msg.senderType === 'merchant' }"
            >
              <div class="message-avatar" v-if="msg.senderType === 'user'">
                {{ getAvatarText(currentConv.userName) }}
              </div>
              <div class="message-bubble">
                <div class="message-content">{{ msg.content }}</div>
                <div class="message-time">{{ formatTime(msg.createTime) }}</div>
              </div>
            </div>
            <div v-if="messages.length === 0" class="empty-msg">
              暂无消息，开始对话吧~
            </div>
          </div>
          <div class="input-area">
            <el-input
              v-model="inputText"
              placeholder="输入回复..."
              @keyup.enter="sendMsg"
            />
            <el-button type="primary" @click="sendMsg">发送</el-button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { getConversations, getMessages, sendMessage, markAsRead } from '../api/messages'

const loading = ref(false)
const conversations = ref([])
const currentConv = ref(null)
const messages = ref([])
const inputText = ref('')
const messageListRef = ref(null)
const lastTimestamp = ref(0)
let pollingTimer = null

const fetchConversations = async () => {
  try {
    const res = await getConversations({})
    conversations.value = res.data || []
  } catch (e) {
    console.error('加载会话列表失败', e)
  }
}

const selectConv = async (conv) => {
  currentConv.value = conv
  await loadMessages()
  await markRead()
}

const loadMessages = async () => {
  if (!currentConv.value) return
  try {
    const res = await getMessages({ conversationId: currentConv.value._id })
    messages.value = res.data || []
    if (messages.value.length > 0) {
      lastTimestamp.value = messages.value[messages.value.length - 1].createTime
      scrollToBottom()
    }
  } catch (e) {
    console.error('加载消息失败', e)
  }
}

const sendMsg = async () => {
  if (!inputText.value.trim()) return
  if (!currentConv.value) {
    ElMessage.warning('请选择会话')
    return
  }

  const content = inputText.value.trim()
  inputText.value = ''

  try {
    await sendMessage({
      conversationId: currentConv.value._id,
      senderId: 'merchant',
      senderType: 'merchant',
      senderName: '商家',
      content: content
    })
    await loadMessages()
  } catch (e) {
    console.error('发送消息失败', e)
    ElMessage.error('发送失败')
  }
}

const pollMessages = async () => {
  if (!currentConv.value || !lastTimestamp.value) return
  try {
    const res = await getMessages({
      conversationId: currentConv.value._id,
      lastTimestamp: lastTimestamp.value
    })
    if (res.data && res.data.length > 0) {
      messages.value = [...messages.value, ...res.data]
      lastTimestamp.value = messages.value[messages.value.length - 1].createTime
      scrollToBottom()
    }
  } catch (e) {
    // 忽略轮询错误
  }
}

const markRead = async () => {
  if (!currentConv.value) return
  try {
    await markAsRead({ conversationId: currentConv.value._id, userType: 'merchant' })
  } catch (e) {
    // 忽略错误
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

const getAvatarText = (name) => {
  return name ? name.charAt(0).toUpperCase() : '用'
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (date.getDate() === now.getDate()) {
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const startPolling = () => {
  pollingTimer = setInterval(() => {
    pollMessages()
    fetchConversations()
  }, 3000)
}

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

onMounted(() => {
  fetchConversations()
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.chat-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}

.chat-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.chat-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.conv-list {
  width: 300px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  overflow-y: auto;
}

.conv-item {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.conv-item:hover,
.conv-item.active {
  background: #f5f5f5;
}

.conv-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #4F9A42;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  flex-shrink: 0;
}

.conv-content {
  flex: 1;
  margin-left: 12px;
  overflow: hidden;
}

.conv-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.conv-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.conv-time {
  font-size: 12px;
  color: #999;
}

.conv-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conv-last-msg {
  font-size: 13px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.empty-hint {
  text-align: center;
  padding: 40px 0;
  color: #999;
}

.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f1eb;
}

.no-selection {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.chat-title {
  padding: 12px 20px;
  background: #fff;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #e8e8e8;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message-item {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 20px;
}

.message-item.from-me {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #4F9A42;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.message-bubble {
  max-width: 60%;
  background: #fff;
  border-radius: 12px;
  padding: 12px 16px;
}

.message-item.from-me .message-bubble {
  background: #4F9A42;
}

.message-content {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.message-item.from-me .message-content {
  color: #fff;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
  text-align: right;
}

.message-item.from-me .message-time {
  color: rgba(255, 255, 255, 0.7);
}

.empty-msg {
  text-align: center;
  padding: 60px 0;
  color: #999;
}

.input-area {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: #fff;
  border-top: 1px solid #e8e8e8;
}

.input-area .el-input {
  flex: 1;
}
</style>