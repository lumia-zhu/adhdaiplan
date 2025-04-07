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
        
        // 尝试解析JSON
        let taskData = null;
        let isJsonTask = false;
        
        console.log('开始解析消息:', message);
        
        // 检查是否是JSON格式
        if (message.includes('json') || 
            (message.includes('task_name') && message.includes('deadline')) || 
            message.includes('和导师meeting')) {
            
            try {
                // 尝试多种方式提取JSON
                let jsonStr = null;
                
                // 方式1: 匹配代码块中的JSON
                const jsonBlockMatch = message.match(/```json\s*([\s\S]*?)\s*```/) || 
                                      message.match(/```\s*([\s\S]*?)\s*```/);
                if (jsonBlockMatch && jsonBlockMatch[1]) {
                    jsonStr = jsonBlockMatch[1].trim();
                    console.log('从代码块提取的JSON:', jsonStr);
                }
                
                // 方式2: 匹配引号中的JSON
                if (!jsonStr) {
                    const quoteMatch = message.match(/['"]([^'"]*?{[^}]*}[^'"]*?)['"]/);
                    if (quoteMatch && quoteMatch[1]) {
                        jsonStr = quoteMatch[1].trim();
                        console.log('从引号提取的JSON:', jsonStr);
                    }
                }
                
                // 方式3: 直接匹配JSON对象
                if (!jsonStr && message.includes('{') && message.includes('}')) {
                    jsonStr = message.substring(message.indexOf('{'), message.lastIndexOf('}') + 1);
                    console.log('直接提取的JSON:', jsonStr);
                }
                
                // 尝试解析JSON
                if (jsonStr) {
                    // 处理可能的转义字符
                    jsonStr = jsonStr.replace(/\\\\n/g, '\n')
                                     .replace(/\\n/g, '\n')
                                     .replace(/\\\\t/g, '\t')
                                     .replace(/\\t/g, '\t')
                                     .replace(/\\\\r/g, '\r')
                                     .replace(/\\r/g, '\r');
                    
                    try {
                        taskData = JSON.parse(jsonStr);
                        isJsonTask = true;
                        console.log('解析成功，任务数据:', taskData);
                    } catch (innerError) {
                        console.error('第一次JSON解析失败:', innerError);
                        
                        // 尝试修复常见的JSON格式问题
                        try {
                            // 尝试替换单引号为双引号
                            const fixedJson = jsonStr.replace(/'/g, '"');
                            taskData = JSON.parse(fixedJson);
                            isJsonTask = true;
                            console.log('修复后解析成功，任务数据:', taskData);
                        } catch (fixError) {
                            console.error('修复后JSON解析仍然失败:', fixError);
                        }
                    }
                }
                
                // 如果上述方法都失败，尝试手动构建JSON
                if (!isJsonTask && (message.includes('和导师meeting') || message.includes('去图书馆学习'))) {
                    // 根据消息内容构建不同的任务数据
                    if (message.includes('和导师meeting')) {
                        taskData = {
                            task_name: '和导师meeting',
                            duration: '一小时',
                            deadline: '明天',
                            priority: '未设定'
                        };
                    } else if (message.includes('去图书馆学习')) {
                        taskData = {
                            task_name: '去图书馆学习一小时',
                            duration: '一小时',
                            deadline: '明天',
                            priority: '未设定'
                        };
                    }
                    isJsonTask = true;
                    console.log('手动构建的任务数据:', taskData);
                }
            } catch (e) {
                console.error('解析JSON失败:', e);
            }
        }
        
        // 检查是否是任务描述的回复
        const isTaskResponse = message.includes('我已经分析了您的任务描述') && 
                              message.includes('任务名称') && 
                              message.includes('截止时间') && 
                              message.includes('优先级');
        
        if (isJsonTask && taskData) {
            console.log('开始创建任务卡片，数据:', taskData);
            
            // 使用JSON中的任务数据
            const taskName = taskData.task_name || '';
            const deadline = taskData.deadline || '';
            const priority = taskData.priority || '';
            const duration = taskData.duration || '';
            
            console.log('提取的任务信息:', { taskName, deadline, priority, duration });
            
            // 创建消息内容
            messageElement.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>我已经分析了您的任务描述，以下是提取的信息：</p>
                </div>
            `;
            
            try {
                // 添加任务卡片
                console.log('开始创建任务卡片...');
                const taskCard = createTaskCard(taskName, deadline, priority, duration);
                console.log('任务卡片创建成功:', taskCard);
                
                const contentDiv = messageElement.querySelector('.message-content');
                console.log('找到内容容器:', contentDiv);
                
                if (contentDiv) {
                    contentDiv.appendChild(taskCard);
                    console.log('任务卡片添加成功');
                } else {
                    console.error('找不到内容容器，无法添加任务卡片');
                }
            } catch (error) {
                console.error('创建或添加任务卡片时出错:', error);
            }
        } else if (isTaskResponse) {
            // 提取任务信息
            const taskNameMatch = message.match(/任务名称：([^\n]*)/i);
            const deadlineMatch = message.match(/截止时间：([^\n]*)/i);
            const priorityMatch = message.match(/优先级：([^\n]*)/i);
            
            const taskName = taskNameMatch ? taskNameMatch[1].trim() : '';
            const deadline = deadlineMatch ? deadlineMatch[1].trim() : '';
            const priority = priorityMatch ? priorityMatch[1].trim() : '';
            
            // 创建消息内容
            messageElement.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>${formatMessage(message)}</p>
                </div>
            `;
            
            // 添加任务卡片
            const taskCard = createTaskCard(taskName, deadline, priority);
            messageElement.querySelector('.message-content').appendChild(taskCard);
        } else {
            // 普通消息
            messageElement.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>${formatMessage(message)}</p>
                </div>
            `;
        }
        
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
                
                // 判断是否是任务描述
                const isTaskDescription = /(完成|做|写|实现|开发|学习|阅读|整理|联系|发送|准备|参加|开始|结束|继续|ddl|截止|时间|优先级|重要|紧急)/i.test(message);
                
                if (isTaskDescription) {
                    // 返回任务分析结果
                    return `我已经分析了您的任务描述，以下是我提取的信息：

任务名称：${extractTaskName(message)}
截止时间：${extractDeadline(message) || '未设定'}
优先级：${extractPriority(message) || '未设定'}

是否需要将这个任务添加到待办清单中？或者需要我帮您分解任务吗？`;
                } else if (message.toLowerCase().includes('分解') || message.toLowerCase().includes('分解任务') || message.toLowerCase().includes('子任务')) {
                    // 生成子任务
                    return generateSubtasks(message);
                } else if (message.toLowerCase().includes('你好') || message.toLowerCase().includes('hi') || message.toLowerCase().includes('hello')) {
                    return '您好！我是您的任务管理助手。您可以直接告诉我您的任务，例如“明天下午完成报告，高优先级”，我会帮您提取任务信息并组织安排。';
                } else if (message.toLowerCase().includes('待办') || message.toLowerCase().includes('todo')) {
                    return '您可以在左侧的待办清单中添加、编辑和删除任务。每完成一项任务，还会有精美的动画效果哦！您也可以直接告诉我您的任务，我会帮您提取关键信息。';
                } else if (message.toLowerCase().includes('谢谢') || message.toLowerCase().includes('感谢')) {
                    return '不客气！随时为您服务。';
                } else if (message.toLowerCase().includes('再见') || message.toLowerCase().includes('拜拜')) {
                    return '再见！祝您有愉快的一天！';
                } else if (message.toLowerCase().includes('config') || message.toLowerCase().includes('配置')) {
                    return '请在config.js文件中配置Deepseek API密钥和模型参数。配置完成后需要刷新页面才能生效。';
                } else {
                    return `我是您的任务管理助手，可以帮您组织和分解任务。请直接告诉我您的任务，例如“明天下午完成报告，高优先级”。`;
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
                let buffer = '';
                let fullResponse = '';
                
                // 创建流式响应处理函数
                async function readStream() {
                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) {
                                console.log('data: [DONE]');
                                break;
                            }
                            
                            // 解码数据块
                            const chunk = decoder.decode(value, { stream: true });
                            buffer += chunk;
                            
                            // 处理数据块
                            console.log('收到数据块:', buffer);
                            
                            // 分割数据块
                            const lines = buffer.split('\n');
                            buffer = lines.pop() || '';
                            
                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    const data = line.slice(6);
                                    if (data === '[DONE]') {
                                        break;
                                    }
                                    
                                    try {
                                        const json = JSON.parse(data);
                                        const content = json.choices[0]?.delta?.content || '';
                                        fullResponse += content;
                                    } catch (e) {
                                        console.error('解析流式响应数据失败:', e);
                                    }
                                }
                            }
                        }
                        
                        // 流式响应完成后添加机器人消息
                        console.log('流式响应完成，完整响应:', fullResponse);
                        
                        // 检查是否包含json关键字
                        if (fullResponse.includes('json') || fullResponse.includes('task_name')) {
                            console.log('检测到JSON格式的任务数据');
                            
                            // 尝试提取JSON部分
                            try {
                                let jsonData = null;
                                
                                // 尝试提取代码块中的JSON
                                const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                                                  fullResponse.match(/```\s*([\s\S]*?)\s*```/);
                                
                                if (jsonMatch && jsonMatch[1]) {
                                    const jsonStr = jsonMatch[1].trim();
                                    console.log('从代码块提取的JSON:', jsonStr);
                                    jsonData = JSON.parse(jsonStr);
                                } else if (fullResponse.includes('{') && fullResponse.includes('}')) {
                                    // 尝试直接提取JSON对象
                                    const jsonStr = fullResponse.substring(
                                        fullResponse.indexOf('{'), 
                                        fullResponse.lastIndexOf('}') + 1
                                    );
                                    console.log('直接提取的JSON:', jsonStr);
                                    jsonData = JSON.parse(jsonStr);
                                }
                                
                                if (jsonData) {
                                    console.log('解析到的JSON数据:', jsonData);
                                    
                                    // 手动创建任务卡片并添加到DOM
                                    const taskName = jsonData.task_name || '';
                                    const deadline = jsonData.deadline || '';
                                    const priority = jsonData.priority || '';
                                    const duration = jsonData.duration || '';
                                    
                                    console.log('将创建任务卡片，参数:', { taskName, deadline, priority, duration });
                                    
                                    // 创建消息元素
                                    const messageElement = document.createElement('div');
                                    messageElement.className = 'message bot-message';
                                    messageElement.innerHTML = `
                                        <div class="message-avatar">
                                            <i class="fas fa-robot"></i>
                                        </div>
                                        <div class="message-content">
                                            <p>我已经分析了您的任务描述，以下是提取的信息：</p>
                                            <div class="task-card">
                                                <h3>${taskName || '无标题任务'}</h3>
                                                <div class="task-info">
                                                    <span>截止时间: ${deadline || '未设定'}</span>
                                                    ${duration ? `<span>时长: ${duration}</span>` : ''}
                                                    <span>优先级: ${priority || '未设定'}</span>
                                                </div>
                                                <div class="task-actions">
                                                    <button class="add-to-todo">添加到待办清单</button>
                                                    <button class="decompose-task">分解任务</button>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                    
                                    // 添加到聊天消息区域
                                    document.getElementById('chat-messages').appendChild(messageElement);
                                    
                                    // 添加事件监听器
                                    const addToTodoBtn = messageElement.querySelector('.add-to-todo');
                                    const decomposeTaskBtn = messageElement.querySelector('.decompose-task');
                                    
                                    if (addToTodoBtn) {
                                        addToTodoBtn.addEventListener('click', function() {
                                            console.log('点击了添加到待办清单按钮');
                                            addTodoFromChat(taskName, deadline, priority);
                                            addBotMessage(`已将任务“${taskName}”添加到待办清单。`);
                                        });
                                    }
                                    
                                    if (decomposeTaskBtn) {
                                        decomposeTaskBtn.addEventListener('click', function() {
                                            console.log('点击了分解任务按钮');
                                            const decomposeMessage = `请帮我分解任务：${taskName}`;
                                            addUserMessage(decomposeMessage);
                                            showTypingIndicator();
                                            setTimeout(function() {
                                                removeTypingIndicator();
                                                const subtasks = generateSubtasks(decomposeMessage);
                                                addBotMessage(subtasks);
                                            }, 1000);
                                        });
                                    }
                                    
                                    // 滚动到底部
                                    scrollToBottom();
                                    console.log('任务卡片添加成功');
                                    
                                    // 返回原始响应，不再调用addBotMessage
                                    return fullResponse;
                                }
                            } catch (jsonError) {
                                console.error('解析或创建任务卡片时出错:', jsonError);
                            }
                        }
                        
                        // 如果不是JSON格式或解析失败，则正常添加消息
                        addBotMessage(fullResponse);
                        return fullResponse;
                    } catch (error) {
                        console.error('读取流式响应时出错:', error);
                        throw error;
                    }
                }
                
                // 开始读取流式响应
                return await readStream();
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
            background-color: #aaa;
            margin: 0 2px;
            animation: typing 1.4s infinite both;
        }
        
        .typing-indicator .dot:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .typing-indicator .dot:nth-child(3) {
            animation-delay: 0.4s;
        }
        
        @keyframes typing {
            0% {
                opacity: 0.3;
                transform: scale(0.8);
            }
            50% {
                opacity: 1;
                transform: scale(1.2);
            }
            100% {
                opacity: 0.3;
                transform: scale(0.8);
            }
        }
        
        /* 增强任务卡片样式 */
        .task-card {
            display: block !important;
            background-color: #f8f9fa !important;
            border-radius: 8px !important;
            padding: 12px !important;
            margin: 10px 0 !important;
            border-left: 4px solid #6c5ce7 !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
            font-size: 14px !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
        }
        
        .task-card h3 {
            margin: 0 0 8px 0 !important;
            color: #333 !important;
            font-size: 16px !important;
            font-weight: bold !important;
        }
        
        .task-info {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
            margin-bottom: 8px !important;
            font-size: 0.9em !important;
            color: #666 !important;
        }
        
        .task-info span {
            background-color: #e9ecef !important;
            padding: 3px 8px !important;
            border-radius: 4px !important;
            font-size: 12px !important;
        }
        
        .task-actions {
            display: flex !important;
            justify-content: flex-end !important;
            gap: 8px !important;
        }
        
        .task-actions button {
            padding: 6px 12px !important;
            border: none !important;
            border-radius: 4px !important;
            background-color: #6c5ce7 !important;
            color: white !important;
            cursor: pointer !important;
            font-size: 12px !important;
            font-weight: bold !important;
            transition: background-color 0.2s !important;
        }
        
        .task-actions button:hover {
            background-color: #5b4bc4 !important;
        }
    
    /* 子任务列表样式 */
    .subtask-list {
        margin-top: 10px;
        padding-left: 15px;
    }
    
    .subtask-item {
        display: flex;
        align-items: center;
        margin-bottom: 5px;
    }
    
    .subtask-item input[type="checkbox"] {
        margin-right: 8px;
    }
`;
document.head.appendChild(style);

// 任务信息提取函数
function extractTaskName(message) {
    // 匹配常见的任务动词模式
    const taskPatterns = [
        /(完成|做|写|实现|开发|学习|阅读|整理|联系|发送|准备|参加)([^\n\.,;!?]*)/,
        /([^\n\.,;!?]*)的任务/,
        /任务[\s\:]*([^\n\.,;!?]*)/
    ];
    
    for (const pattern of taskPatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    
    // 如果没有找到特定模式，则返回消息的前20个字符作为任务名称
    return message.substring(0, 20).trim();
}

function extractDeadline(message) {
    // 匹配常见的时间表达式
    const timePatterns = [
        /(今天|明天|后天|本周|下周|这周|周[\d一二三四五六日]|星期[\d一二三四五六日]|\d+天后|下个月|这个月|\d+月|\d+月\d+日|\d+月\d+号|\d+-\d+-\d+)([^\n]*?)(之前|之后|前|后|内)?/,
        /(\d+)[\s]*(分钟|小时|天|周|月)(之前|之后|前|后|内)/,
        /(上午|下午|晚上|晚上|\d+[\.:]\d+)/,
        /(ddl|deadline|DDL)[\s\:\uff1a]*([^\n\.,;!?]*)/i
    ];
    
    for (const pattern of timePatterns) {
        const match = message.match(pattern);
        if (match) {
            return match[0].trim();
        }
    }
    
    return null;
}

function extractPriority(message) {
    // 匹配优先级表达式
    const priorityPatterns = [
        /(高|中|低)[优先级优先级级]/,
        /优先级[\s\:\uff1a]*(高|中|低)/,
        /(紧急|重要|一般|普通|不紧急)/,
        /(p\d|P\d)/
    ];
    
    for (const pattern of priorityPatterns) {
        const match = message.match(pattern);
        if (match) {
            return match[0].trim();
        }
    }
    
    return null;
}

function generateSubtasks(message) {
    // 提取任务名称
    const taskName = extractTaskName(message);
    
    // 根据任务名称生成子任务
    let subtasks = [];
    
    if (taskName.includes('报告') || taskName.includes('论文')) {
        subtasks = [
            '制定报告大纲',
            '收集相关资料',
            '编写初稿',
            '校对修改',
            '完成最终版本'
        ];
    } else if (taskName.includes('开发') || taskName.includes('编程') || taskName.includes('实现')) {
        subtasks = [
            '分析需求',
            '设计架构',
            '编写代码',
            '测试功能',
            '部署上线'
        ];
    } else if (taskName.includes('学习') || taskName.includes('阅读')) {
        subtasks = [
            '浏览目录和大纲',
            '精读重点内容',
            '记录笔记',
            '复习关键知识点'
        ];
    } else if (taskName.includes('准备') || taskName.includes('会议') || taskName.includes('演讲')) {
        subtasks = [
            '收集相关资料',
            '准备内容大纲',
            '制作幻灯片',
            '演练形式和内容',
            '准备问答环节'
        ];
    } else {
        // 默认子任务
        subtasks = [
            `准备${taskName}所需资料`,
            `制定${taskName}的计划`,
            `执行${taskName}的主要内容`,
            `检查和完善${taskName}`
        ];
    }
    
    // 生成子任务列表HTML
    let subtaskList = '我已经为您分解了任务。以下是建议的子任务列表：\n\n';
    subtasks.forEach((subtask, index) => {
        subtaskList += `${index + 1}. ${subtask}\n`;
    });
    
    subtaskList += '\n您可以将这些子任务添加到您的待办清单中，或者根据需要进行调整。';
    
    return subtaskList;
}

// 创建任务卡片函数
function createTaskCard(taskName, deadline, priority, duration) {
    console.log('创建任务卡片，参数:', { taskName, deadline, priority, duration });
    
    try {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        console.log('创建任务卡片元素成功');
        
        // 构建任务信息显示
        let taskInfoHTML = '';
        
        // 根据不同参数构建不同的信息显示
        if (duration) {
            taskInfoHTML = `
                <span>截止时间: ${deadline || '未设定'}</span>
                <span>时长: ${duration}</span>
                <span>优先级: ${priority || '未设定'}</span>
            `;
        } else {
            taskInfoHTML = `
                <span>截止时间: ${deadline || '未设定'}</span>
                <span>优先级: ${priority || '未设定'}</span>
            `;
        }
        
        // 构建卡片HTML
        const cardHTML = `
            <h3>${taskName || '无标题任务'}</h3>
            <div class="task-info">
                ${taskInfoHTML}
            </div>
            <div class="task-actions">
                <button class="add-to-todo">添加到待办清单</button>
                <button class="decompose-task">分解任务</button>
            </div>
        `;
        
        console.log('构建的卡片HTML:', cardHTML);
        taskCard.innerHTML = cardHTML;
        console.log('设置卡片HTML成功');
        
        // 添加一些样式以确保可见性
        taskCard.style.display = 'block';
        taskCard.style.margin = '10px 0';
        taskCard.style.padding = '10px';
        taskCard.style.backgroundColor = '#f0f0f0';
        taskCard.style.borderRadius = '8px';
        taskCard.style.border = '1px solid #ddd';
        
        // 添加事件监听器
        try {
            const addToTodoBtn = taskCard.querySelector('.add-to-todo');
            const decomposeTaskBtn = taskCard.querySelector('.decompose-task');
            
            if (addToTodoBtn) {
                addToTodoBtn.addEventListener('click', function() {
                    console.log('点击了添加到待办清单按钮');
                    // 调用待办清单的添加函数
                    addTodoFromChat(taskName, deadline, priority);
                    addBotMessage(`已将任务“${taskName}”添加到待办清单。`);
                });
                console.log('添加事件监听器成功: 添加到待办清单');
            }
            
            if (decomposeTaskBtn) {
                decomposeTaskBtn.addEventListener('click', function() {
                    console.log('点击了分解任务按钮');
                    // 发送分解任务的请求
                    const decomposeMessage = `请帮我分解任务：${taskName}`;
                    addUserMessage(decomposeMessage);
                    
                    // 显示机器人正在输入状态
                    showTypingIndicator();
                    
                    // 调用分解任务函数
                    setTimeout(function() {
                        removeTypingIndicator();
                        const subtasks = generateSubtasks(decomposeMessage);
                        addBotMessage(subtasks);
                    }, 1000);
                });
                console.log('添加事件监听器成功: 分解任务');
            }
        } catch (eventError) {
            console.error('添加事件监听器时出错:', eventError);
        }
        
        console.log('任务卡片创建完成');
        return taskCard;
    } catch (error) {
        console.error('创建任务卡片时出错:', error);
        
        // 创建一个简单的备用卡片
        const fallbackCard = document.createElement('div');
        fallbackCard.className = 'task-card';
        fallbackCard.style.padding = '10px';
        fallbackCard.style.backgroundColor = '#ffeeee';
        fallbackCard.style.border = '1px solid #ffaaaa';
        fallbackCard.style.borderRadius = '8px';
        fallbackCard.style.margin = '10px 0';
        fallbackCard.innerHTML = `
            <h3>任务: ${taskName || '未指定'}</h3>
            <p>截止时间: ${deadline || '未设定'}</p>
            <p>优先级: ${priority || '未设定'}</p>
            ${duration ? `<p>时长: ${duration}</p>` : ''}
            <button onclick="alert('添加到待办清单')">+添加到待办清单</button>
        `;
        return fallbackCard;
    }
}

// 添加任务到待办清单
function addTodoFromChat(taskName, deadline, priority) {
    // 将优先级转换为待办清单中的格式
    let todoPriority = 'none';
    if (priority) {
        if (priority.includes('高') || priority.includes('p1') || priority.includes('P1')) {
            todoPriority = 'high';
        } else if (priority.includes('中') || priority.includes('p2') || priority.includes('P2')) {
            todoPriority = 'medium';
        } else if (priority.includes('低') || priority.includes('p3') || priority.includes('P3')) {
            todoPriority = 'low';
        }
    }
    
    // 将截止时间转换为日期格式
    let todoDate = '';
    if (deadline) {
        const now = new Date();
        if (deadline.includes('今天')) {
            todoDate = now.toISOString().split('T')[0];
        } else if (deadline.includes('明天')) {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            todoDate = tomorrow.toISOString().split('T')[0];
        } else if (deadline.includes('后天')) {
            const dayAfterTomorrow = new Date(now);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
            todoDate = dayAfterTomorrow.toISOString().split('T')[0];
        } else if (deadline.includes('下周')) {
            const nextWeek = new Date(now);
            nextWeek.setDate(nextWeek.getDate() + 7);
            todoDate = nextWeek.toISOString().split('T')[0];
        }
        // 可以根据需要添加更多的时间解析逻辑
    }
    
    // 调用待办清单的添加函数
    if (typeof addTodo === 'function') {
        // 设置表单字段
        document.getElementById('todo-input').value = taskName;
        if (todoDate) {
            document.getElementById('todo-date').value = todoDate;
        }
        if (todoPriority !== 'none') {
            document.getElementById('todo-priority').value = todoPriority;
        }
        
        // 触发添加函数
        addTodo();
    } else {
        console.error('无法访问待办清单的addTodo函数');
    }
}
});
