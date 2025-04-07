// 聊天机器人功能
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');
    
    // 监听发送按钮点击事件
    sendButton.addEventListener('click', sendMessage);
    
    // 监听输入框回车事件
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 自动调整输入框高度
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.scrollHeight > 120) {
            this.style.height = '120px';
        }
    });
    
    // 发送消息函数
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message === '') return;
        
        // 添加用户消息到聊天窗口
        addUserMessage(message);
        
        // 清空输入框并重置高度
        chatInput.value = '';
        chatInput.style.height = '50px';
        
        // 显示机器人正在输入状态
        showTypingIndicator();
        
        // 检查是否使用流式响应
        const isStreamMode = config && config.parameters && config.parameters.stream;
        
        // 调用Deepseek API获取回复
        getDeepseekResponse(message)
            .then(response => {
                // 移除正在输入状态
                removeTypingIndicator();
                
                // 只在非流式模式下添加机器人回复
                // 流式模式下，机器人回复已在getDeepseekResponse函数中添加
                if (!isStreamMode) {
                    addBotMessage(response);
                }
            })
            .catch(error => {
                // 移除正在输入状态
                removeTypingIndicator();
                // 显示错误消息
                addBotMessage('抱歉，我遇到了一些问题，无法回答您的问题。请稍后再试。');
                console.error('Deepseek API错误:', error);
            });
    }
    
    // 添加用户消息到聊天窗口
    function addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <p>${formatMessage(message)}</p>
            </div>
        `;
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }
    
    // 添加机器人消息到聊天窗口
    function addBotMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        messageElement.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p>${formatMessage(message)}</p>
            </div>
        `;
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }
    
    // 显示机器人正在输入状态
    function showTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.className = 'message bot-message typing-indicator';
        typingElement.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p><span class="dot"></span><span class="dot"></span><span class="dot"></span></p>
            </div>
        `;
        chatMessages.appendChild(typingElement);
        scrollToBottom();
    }
    
    // 移除正在输入状态
    function removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // 滚动到聊天窗口底部
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // 格式化消息（处理换行符和链接）
    function formatMessage(message) {
        // 将换行符转换为<br>
        let formattedMessage = message.replace(/\n/g, '<br>');
        
        // 将URL转换为可点击的链接
        formattedMessage = formattedMessage.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        
        return formattedMessage;
    }
    
    // 添加调试信息，显示所有全局变量
    console.log('当前全局变量:', window);
    console.log('是否存在config变量:', typeof config !== 'undefined');
    
    // 使用全局变量的config配置，已在config.js中定义
    // 如果没有加载到全局配置，使用默认配置
    if (typeof config === 'undefined') {
        console.warn('未检测到全局config变量，使用默认配置');
        window.config = {
            apiKey: '',
            model: 'deepseek-chat',
            baseURL: 'https://api.deepseek.com',
            systemPrompt: 'You are a helpful assistant.',
            parameters: {
                stream: false
            }
        };
    } else {
        console.log('检测到全局config变量:', config);
        console.log('API密钥是否存在:', !!config.apiKey);
        console.log('API密钥值:', config.apiKey);
    }
    
    // 调用Deepseek API获取回复
    async function getDeepseekResponse(message) {
        try {
            // 打印当前配置状态，用于调试
            console.log('当前配置状态:', JSON.stringify(config, null, 2));
            
            // 检查是否配置了API密钥
            if (!config.apiKey || config.apiKey === 'YOUR_DEEPSEEK_API_KEY_HERE') {
                console.warn('未配置Deepseek API密钥，使用模拟响应');
                // 模拟API调用延迟
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // 简单的模拟响应逻辑
                if (message.toLowerCase().includes('你好') || message.toLowerCase().includes('hi') || message.toLowerCase().includes('hello')) {
                    return '您好！有什么我可以帮助您的吗？';
                } else if (message.toLowerCase().includes('待办') || message.toLowerCase().includes('todo')) {
                    return '您可以在左侧的待办清单中添加、编辑和删除任务。每完成一项任务，还会有精美的动画效果哦！';
                } else if (message.toLowerCase().includes('谢谢') || message.toLowerCase().includes('感谢')) {
                    return '不客气！随时为您服务。';
                } else if (message.toLowerCase().includes('再见') || message.toLowerCase().includes('拜拜')) {
                    return '再见！祝您有愉快的一天！';
                } else if (message.toLowerCase().includes('config') || message.toLowerCase().includes('配置')) {
                    return '请在config.js文件中配置Deepseek API密钥和模型参数。配置完成后需要刷新页面才能生效。';
                } else {
                    return `我收到了您的消息“${message}”。请在config.js文件中配置Deepseek API密钥和模型参数，以获得真实的AI助手响应。`;
                }
            }
            
            // 使用真实的Deepseek API
            console.log('调用Deepseek API，模型:', config.model);
            console.log('API密钥:', config.apiKey);
            
            // 简化API调用，去掉不必要的参数
            const chatEndpoint = `${config.baseURL}/chat/completions`;
            console.log('调用API端点:', chatEndpoint);
            
            // 准备请求体
            const requestBody = {
                model: config.model,
                messages: [
                    {
                        role: 'system',
                        content: config.systemPrompt || '你是一个智能助手，可以回答用户的问题、提供建议或者帮助用户完成任务。'
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                stream: config.parameters.stream
            };
            
            console.log('请求体:', JSON.stringify(requestBody, null, 2));
            
            const response = await fetch(chatEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Deepseek API 请求失败: ${response.status} ${JSON.stringify(errorData)}`);
            }
            
            // 处理流式响应
            if (config.parameters.stream) {
                console.log('使用流式响应模式');
                
                // 创建一个临时元素来存储流式响应
                const tempMessageId = `temp-${Date.now()}`;
                addBotMessage(''); // 添加一个空消息，稍后会更新
                const messageElement = document.querySelector('.bot-message:last-child .message-content p');
                
                // 设置流式响应的处理函数
                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let fullContent = '';
                
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        
                        const chunk = decoder.decode(value, { stream: true });
                        console.log('收到数据块:', chunk);
                        
                        // 处理数据块
                        const lines = chunk.split('\n').filter(line => line.trim() !== '');
                        
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.substring(6);
                                if (data === '[DONE]') continue;
                                
                                try {
                                    const parsedData = JSON.parse(data);
                                    if (parsedData.choices && parsedData.choices[0].delta && parsedData.choices[0].delta.content) {
                                        const content = parsedData.choices[0].delta.content;
                                        fullContent += content;
                                        if (messageElement) {
                                            messageElement.textContent = fullContent;
                                            scrollToBottom();
                                        }
                                    }
                                } catch (e) {
                                    console.error('解析流式数据错误:', e);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('读取流式响应错误:', error);
                }
                
                return fullContent;
            } else {
                // 非流式响应处理
                const data = await response.json();
                return data.choices[0].message.content;
            }
        } catch (error) {
            console.error('获取Deepseek响应时出错:', error);
            return `抱歉，连接Deepseek API时出现问题: ${error.message}. 请检查您的API密钥和网络连接。`;
        }
    }
    
    // 添加一些CSS样式
    const style = document.createElement('style');
    style.textContent = `
        .typing-indicator .dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--secondary-color);
            margin-right: 4px;
            animation: typing 1.4s infinite both;
        }
        
        .typing-indicator .dot:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .typing-indicator .dot:nth-child(3) {
            animation-delay: 0.4s;
        }
        
        @keyframes typing {
            0%, 60%, 100% {
                transform: translateY(0);
            }
            30% {
                transform: translateY(-6px);
            }
        }
    `;
    document.head.appendChild(style);
});
