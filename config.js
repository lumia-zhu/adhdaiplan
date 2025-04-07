// Deepseek API配置
// 定义为全局变量，而不是ES模块
window.config = {
    // Deepseek API密钥
    apiKey: "sk-9344e0d1d36047efa4123f15333efc72",
    
    // API基础URL
    baseURL: "https://api.deepseek.com",
    
    // Deepseek模型配置
    // deepseek-chat: DeepSeek-V3 最新版本
    // deepseek-reasoner: DeepSeek-R1 推理模型
    model: "deepseek-chat",
    
    // 系统提示词
    systemPrompt: "You are a helpful assistant.",
    
    // 请求参数 - 简化参数，只保留必要的
    parameters: {
        stream: true           // 是否使用流式输出，设置为true可获得实时响应
    }
};
