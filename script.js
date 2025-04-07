// 获取DOM元素
const todoInput = document.getElementById('todo-input');
const todoDate = document.getElementById('todo-date');
const todoPriority = document.getElementById('todo-priority');
const addButton = document.getElementById('add-button');
const todoList = document.getElementById('todo-list');
const themeSwitch = document.getElementById('theme-switch');
const showFormButton = document.getElementById('show-form-button');
const closeFormButton = document.getElementById('close-form-button');
const todoForm = document.getElementById('todo-form');

// 用于存储待办事项的数组
let todos = JSON.parse(localStorage.getItem('todos')) || [];

// 从本地存储加载待办事项
function loadTodos() {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
        todos = JSON.parse(savedTodos);
    }
    renderTodoList();
}

// 保存待办事项到本地存储
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 更新统计信息
function updateStats() {
    const totalCount = todos.length;
    const pendingCount = todos.filter(todo => !todo.completed).length;
    const completedCount = totalCount - pendingCount;
    const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    // 更新数字
    document.getElementById('total-count').textContent = totalCount;
    document.getElementById('pending-count').textContent = pendingCount;
    
    // 更新完成百分比
    document.querySelector('.completion-percent').textContent = `${completionPercent}%`;
    
    // 更新圆环进度 - 使用CSS变量而不是直接设置背景
    const completionCircle = document.querySelector('.completion-circle');
    completionCircle.style.setProperty('--completion-percent', `${completionPercent}%`);
}

// 初始化主题
function initTheme() {
    // 检查本地存储中的主题偏好
    const darkMode = localStorage.getItem('theme') === 'dark';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        themeSwitch.checked = true;
    }
}

// 添加新的待办事项
// 将addTodo函数设置为全局可访问
window.addTodo = function() {
    const text = todoInput.value.trim();
    
    // 验证输入不为空
    if (text === '') {
        alert('请输入待办事项内容！');
        return;
    }
    
    // 获取日期和优先级
    const dueDate = todoDate.value || null;
    const priority = todoPriority.value;
    
    // 创建新的待办事项对象
    const newTodo = {
        id: generateId(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate: dueDate,
        priority: priority !== 'none' ? priority : null
    };
    
    // 添加到数组并保存
    todos.push(newTodo);
    saveTodos();
    
    // 清空输入框并重新渲染列表
    todoInput.value = '';
    
    // 更新列表
    renderTodoList();
    
    // 隐藏表单
    todoForm.style.display = 'none';
    document.querySelector('.overlay').style.display = 'none';
    
    // 更新统计信息
    updateStats();
}

// 渲染待办事项列表
function renderTodoList() {
    // 清空列表
    todoList.innerHTML = '';
    
    // 按完成状态和日期排序
    const sortedTodos = [...todos].sort((a, b) => {
        // 先按完成状态排序（未完成的在前）
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        // 再按截止日期排序
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
    });
    
    // 如果没有待办事项，显示提示信息
    if (sortedTodos.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = '没有待办事项，请添加新的任务！';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.color = 'var(--secondary-color)';
        emptyMessage.style.padding = '20px 0';
        todoList.appendChild(emptyMessage);
        return;
    }
    
    // 遍历待办事项数组并创建列表项
    sortedTodos.forEach((todo, index) => {
        // 在原始数组中找到索引
        const originalIndex = todos.findIndex(t => t.id === todo.id);
        
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.dataset.id = originalIndex;
        
        // 格式化日期为简洁形式（仅显示时间）
        let timeStr = '';
        if (todo.dueDate) {
            const date = new Date(todo.dueDate);
            timeStr = `at ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')} ${date.getHours() >= 12 ? 'pm' : 'am'}`;
        }
        
        // 使用模板字符串创建待办事项HTML
        li.innerHTML = `
            <div class="todo-checkbox">
                <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                <span class="checkmark"></span>
            </div>
            <div class="todo-content">
                <p class="todo-text">${todo.text}</p>
                ${timeStr ? `<div class="todo-details">${timeStr}</div>` : ''}
            </div>
            <div class="todo-actions">
                <button class="todo-button edit-button" onclick="editTodo(${originalIndex})"><i class="fas fa-edit"></i></button>
                <button class="todo-button delete-button" onclick="deleteTodo(${originalIndex})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        // 添加复选框点击事件
        const checkbox = li.querySelector('.todo-checkbox');
        checkbox.addEventListener('click', function(event) {
            // 对整个复选框区域响应点击
            toggleTodoStatus(originalIndex, event);
        });
        
        todoList.appendChild(li);
    });
    
    // 更新统计信息
    updateStats();
}

// 切换待办事项的完成状态
function toggleTodoStatus(index, event) {
    const x = event ? event.clientX : window.innerWidth / 2;
    const y = event ? event.clientY : window.innerHeight / 2;
    
    const wasCompleted = todos[index].completed;
    todos[index].completed = !todos[index].completed;
    
    // 保存到本地存储
    saveTodos();
    
    // 更新UI
    renderTodoList();
    
    // 如果是标记为完成，播放特效
    if (!wasCompleted && todos[index].completed) {
        playRandomEffect(x, y);
    }
}

// 编辑待办事项 - 现在只是调用统一的表单函数
function editTodo(index) {
    createTaskForm(index);
}

// 创建任务表单（新增或编辑）
function createTaskForm(index) {
    // 如果有index，则是编辑模式，否则是新增模式
    const isEditMode = index !== undefined;
    const todo = isEditMode ? todos[index] : { text: '', dueDate: '', priority: null };
    
    // 创建编辑表单
    const editForm = document.createElement('div');
    editForm.className = 'edit-form';
    
    // 设置表单标题（使用:before伪元素显示）
    editForm.dataset.formTitle = isEditMode ? '编辑任务' : '新增任务';
    
    // 创建输入框
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.value = todo.text;
    textInput.placeholder = '输入任务内容...';
    
    // 创建日期输入框和标签
    const dateLabel = document.createElement('label');
    dateLabel.textContent = '截止日期：';
    dateLabel.style.fontSize = '0.9rem';
    dateLabel.style.fontWeight = '500';
    dateLabel.style.marginBottom = '8px';
    dateLabel.style.display = 'block';
    
    const dateInput = document.createElement('input');
    dateInput.type = 'datetime-local';
    dateInput.value = todo.dueDate || '';
    
    // 创建优先级选择框和标签
    const priorityLabel = document.createElement('label');
    priorityLabel.textContent = '优先级：';
    priorityLabel.style.fontSize = '0.9rem';
    priorityLabel.style.fontWeight = '500';
    priorityLabel.style.marginBottom = '8px';
    priorityLabel.style.display = 'block';
    
    const prioritySelect = document.createElement('select');
    prioritySelect.innerHTML = `
        <option value="none" ${todo.priority === null ? 'selected' : ''}>无</option>
        <option value="low" ${todo.priority === 'low' ? 'selected' : ''}>低</option>
        <option value="medium" ${todo.priority === 'medium' ? 'selected' : ''}>中</option>
        <option value="high" ${todo.priority === 'high' ? 'selected' : ''}>高</option>
    `;
    
    // 创建按钮组
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    
    // 创建保存按钮
    const saveButton = document.createElement('button');
    saveButton.textContent = isEditMode ? '保存任务' : '添加任务';
    saveButton.className = 'save-button';
    saveButton.addEventListener('click', function() {
        const text = textInput.value.trim();
        
        // 验证输入不为空
        if (text === '') {
            alert('请输入任务内容！');
            return;
        }
        
        if (isEditMode) {
            // 更新待办事项
            todo.text = text;
            todo.dueDate = dateInput.value || null;
            todo.priority = prioritySelect.value !== 'none' ? prioritySelect.value : null;
        } else {
            // 创建新的待办事项对象
            const newTodo = {
                id: generateId(),
                text: text,
                completed: false,
                createdAt: new Date().toISOString(),
                dueDate: dateInput.value || null,
                priority: prioritySelect.value !== 'none' ? prioritySelect.value : null
            };
            
            // 添加到数组
            todos.push(newTodo);
        }
        
        // 保存并更新UI
        saveTodos();
        renderTodoList();
        updateStats();
        
        // 关闭编辑表单
        document.body.removeChild(editForm.parentNode);
    });
    
    // 创建取消按钮
    const cancelButton = document.createElement('button');
    cancelButton.textContent = '取消';
    cancelButton.className = 'cancel-button';
    cancelButton.addEventListener('click', function() {
        document.body.removeChild(editForm.parentNode);
    });
    
    // 添加按钮到按钮组
    buttonGroup.appendChild(saveButton);
    buttonGroup.appendChild(cancelButton);
    
    // 创建日期和优先级容器
    const dateContainer = document.createElement('div');
    dateContainer.appendChild(dateLabel);
    dateContainer.appendChild(dateInput);
    
    const priorityContainer = document.createElement('div');
    priorityContainer.appendChild(priorityLabel);
    priorityContainer.appendChild(prioritySelect);
    
    // 创建高级选项容器
    const advancedOptions = document.createElement('div');
    advancedOptions.className = 'advanced-options';
    advancedOptions.appendChild(dateContainer);
    advancedOptions.appendChild(priorityContainer);
    
    // 添加所有元素到表单
    editForm.appendChild(textInput);
    editForm.appendChild(advancedOptions);
    editForm.appendChild(buttonGroup);
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.appendChild(editForm);
    
    // 点击模态框空白区域关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // 添加到页面
    document.body.appendChild(modal);
    
    // 让输入框获得焦点
    textInput.focus();
}

// 删除待办事项
function deleteTodo(index) {
    if (confirm('确定要删除这个待办事项吗？')) {
        todos.splice(index, 1);
        saveTodos();
        renderTodoList();
        updateStats();
    }
}

// 播放随机特效
function playRandomEffect(x, y) {
    const effects = ['confetti', 'fireworks', 'stars', 'hearts', 'thumbsUp', 'celebration', 'emoji', 'glitter', 'school', 'snow', 'bubbles', 'coins', 'particles', 'rainbow', 'achievement'];
    const effect = effects[Math.floor(Math.random() * effects.length)];
    
    switch (effect) {
        case 'confetti':
            playConfettiEffect(x, y);
            break;
        case 'fireworks':
            playFireworksEffect(x, y);
            break;
        case 'stars':
            playStarsEffect(x, y);
            break;
        case 'hearts':
            playHeartsEffect(x, y);
            break;
        case 'thumbsUp':
            playThumbsUpEffect();
            break;
        case 'celebration':
            playCelebrationEffect();
            break;
        case 'emoji':
            playEmojiEffect(document.elementFromPoint(x, y), x, y);
            break;
        case 'glitter':
            playGlitterEffect(document.elementFromPoint(x, y), x, y);
            break;
        case 'school':
            playSchoolEffect();
            break;
        case 'snow':
            playSnowEffect();
            break;
        case 'bubbles':
            playBubblesEffect(document.elementFromPoint(x, y), x, y);
            break;
        case 'coins':
            playCoinsEffect(document.elementFromPoint(x, y), x, y);
            break;
        case 'particles':
            playParticlesEffect(x, y);
            break;
        case 'rainbow':
            playRainbowEffect();
            break;
        case 'achievement':
            playAchievementEffect();
            break;
        default:
            playConfettiEffect(x, y);
    }
}

// 彩色纸屑特效
function playConfettiEffect(x, y) {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: x / window.innerWidth, y: y / window.innerHeight }
    });
}

// 烟花特效
function playFireworksEffect(x, y) {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.top = '0';
    container.style.left = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    
    const fireworks = new Fireworks(container, {
        autoresize: true,
        opacity: 0.5,
        acceleration: 1.05,
        friction: 0.97,
        gravity: 1.5,
        particles: 50,
        traceLength: 3,
        traceSpeed: 10,
        explosion: 5,
        intensity: 30,
        flickering: 50,
        lineStyle: 'round',
        hue: {
            min: 0,
            max: 360
        },
        delay: {
            min: 30,
            max: 60
        },
        rocketsPoint: {
            min: 50,
            max: 50
        },
        lineWidth: {
            explosion: {
                min: 1,
                max: 3
            },
            trace: {
                min: 1,
                max: 2
            }
        },
        brightness: {
            min: 50,
            max: 80
        },
        decay: {
            min: 0.015,
            max: 0.03
        },
        mouse: {
            click: true,
            move: false,
            max: 1
        }
    });
    
    fireworks.start();
    
    // 点击位置发射烟花
    fireworks.launch(1, { x, y });
    
    // 3秒后停止并移除容器
    setTimeout(() => {
        fireworks.stop();
        document.body.removeChild(container);
    }, 3000);
}

// 星星特效
function playStarsEffect(x, y) {
    const count = 20;
    const defaults = {
        spread: 360,
        ticks: 50,
        gravity: 0,
        decay: 0.94,
        startVelocity: 30,
        shapes: ['star'],
        colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8']
    };

    confetti({
        ...defaults,
        particleCount: count,
        origin: { x: x / window.innerWidth, y: y / window.innerHeight }
    });
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化主题
    initTheme();
    
    // 从本地存储加载待办事项
    loadTodos();
    
    // 初始化表单为隐藏状态
    todoForm.style.display = 'none';
    
    // 更新统计信息
    updateStats();
    
    // 添加事件监听器
    addButton.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
    
    // 主题切换功能暂时禁用
    // 注释掉不存在的themeSwitch元素
    /*
    // 如果需要主题切换功能，请先在HTML中添加对应的元素
    themeSwitch.addEventListener('change', function() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });
    */
    
    // 创建覆盖层
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
    
    // 显示表单按钮事件
    showFormButton.addEventListener('click', function() {
        createTaskForm();
    });
    
    // 隐藏表单按钮事件
    closeFormButton.addEventListener('click', function() {
        todoForm.style.display = 'none';
        overlay.style.display = 'none';
    });
    
    // 点击覆盖层隐藏表单
    overlay.addEventListener('click', function() {
        todoForm.style.display = 'none';
        overlay.style.display = 'none';
    });
});

// 心形特效
function playHeartsEffect(x, y) {
    const count = 20;
    const defaults = {
        spread: 360,
        ticks: 100,
        gravity: 0,
        decay: 0.94,
        startVelocity: 30,
        shapes: ['heart'],
        colors: ['FF0000', 'FF5252', 'FF7B7B', 'FFB8B8', 'FFC9C9']
    };

    confetti({
        ...defaults,
        particleCount: count,
        origin: { x: x / window.innerWidth, y: y / window.innerHeight }
    });
}

// 点赞特效
function playThumbsUpEffect() {
    Swal.fire({
        title: '任务完成！',
        text: '太棒了，继续保持！',
        icon: 'success',
        confirmButtonText: '谢谢',
        timer: 2000,
        showConfirmButton: false
    });
}

// 庆祝特效
function playCelebrationEffect() {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // 随机位置发射彩色纸屑
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
    }, 250);
}

// 表情爆炸特效
function playEmojiEffect(element, x, y) {
    const emojis = ['🎉', '🎊', '👍', '🥳', '⭐', '🏆', '✅', '🚀', '💯'];
    party.confetti(element || document.body, {
        count: party.variation.range(20, 40),
        size: party.variation.range(0.6, 1.4),
        spread: party.variation.range(30, 50),
        speed: party.variation.range(100, 400),
        shapes: emojis.map(emoji => party.shape.emoji(emoji))
    });
}

// 闪光特效
function playGlitterEffect(element, x, y) {
    party.sparkles(element || document.body, {
        count: party.variation.range(20, 40),
        size: party.variation.range(0.8, 1.2),
        speed: party.variation.range(100, 300),
        lifetime: party.variation.range(1, 2)
    });
}

// 校园风特效
function playSchoolEffect() {
    Swal.fire({
        title: '完成任务！',
        text: '你获得了一枚金星⭐',
        imageUrl: 'https://cdn.pixabay.com/photo/2014/04/02/10/47/red-304573_1280.png',
        imageWidth: 100,
        imageHeight: 100,
        imageAlt: 'Gold Star',
        timer: 2000,
        showConfirmButton: false
    });
}

// 雪花特效
function playSnowEffect() {
    const snowflakes = new Snowflakes({
        color: '#ffffff',
        count: 50,
        minOpacity: 0.2,
        maxOpacity: 0.8,
        minSize: 8,
        maxSize: 20,
        speed: 1,
        rotation: true,
        wind: true
    });
    
    // 5秒后停止
    setTimeout(() => {
        snowflakes.destroy();
    }, 5000);
}

// 气泡特效
function playBubblesEffect(element, x, y) {
    party.confetti(element || document.body, {
        count: party.variation.range(20, 40),
        size: party.variation.range(0.6, 1.4),
        speed: party.variation.range(50, 300),
        lifetime: party.variation.range(2, 4),
        shapes: ['circle'],
        color: party.variation.gradientSample(party.gradient.simple('blue', 'cyan'))
    });
}

// 金币特效
function playCoinsEffect(element, x, y) {
    party.confetti(element || document.body, {
        count: party.variation.range(10, 20),
        size: party.variation.range(0.8, 1.2),
        speed: party.variation.range(200, 500),
        shapes: ['circle'],
        color: party.color.gold
    });
}

// 粒子流特效
function playParticlesEffect(x, y) {
    tsParticles.load("tsparticles", {
        fullScreen: {
            enable: true,
            zIndex: 1
        },
        particles: {
            number: {
                value: 0
            },
            color: {
                value: ["#00FFFC", "#FC00FF", "#fffc00"]
            },
            shape: {
                type: ["circle", "square"]
            },
            opacity: {
                value: { min: 0, max: 1 },
                animation: {
                    enable: true,
                    speed: 1,
                    startValue: "max",
                    destroy: "min"
                }
            },
            size: {
                value: { min: 3, max: 7 }
            },
            life: {
                duration: {
                    sync: true,
                    value: 3
                },
                count: 1
            },
            move: {
                enable: true,
                gravity: {
                    enable: true,
                    acceleration: 10
                },
                speed: { min: 10, max: 20 },
                decay: 0.05,
                direction: "none",
                straight: false,
                outModes: {
                    default: "destroy",
                    top: "none"
                }
            },
            rotate: {
                value: {
                    min: 0,
                    max: 360
                },
                direction: "random",
                move: true,
                animation: {
                    enable: true,
                    speed: 60
                }
            },
            tilt: {
                direction: "random",
                enable: true,
                move: true,
                value: {
                    min: 0,
                    max: 360
                },
                animation: {
                    enable: true,
                    speed: 60
                }
            },
            roll: {
                darken: {
                    enable: true,
                    value: 25
                },
                enable: true,
                speed: {
                    min: 15,
                    max: 25
                }
            },
            wobble: {
                distance: 30,
                enable: true,
                move: true,
                speed: {
                    min: -15,
                    max: 15
                }
            }
        },
        emitters: {
            life: {
                count: 1,
                duration: 0.1,
                delay: 0.1
            },
            position: {
                x: x,
                y: y
            },
            rate: {
                delay: 0.15,
                quantity: 10
            },
            size: {
                width: 0,
                height: 0
            }
        }
    });
    
    // 3秒后清除
    setTimeout(() => {
        tsParticles.domItem(0).destroy();
    }, 3000);
}

// 彩虹特效
function playRainbowEffect() {
    Swal.fire({
        title: '任务完成！',
        text: '你真棒！',
        background: 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)',
        color: 'white',
        timer: 2000,
        showConfirmButton: false
    });
}

// 成就解锁特效
function playAchievementEffect() {
    Swal.fire({
        title: '成就解锁！',
        text: '你完成了一项任务！',
        icon: 'success',
        background: '#2c3e50',
        color: 'white',
        iconColor: 'gold',
        timer: 2000,
        showConfirmButton: false
    });
}
