/**
 * ADMIN-ADMIN Dashboard API
 *
 * Используется для логирования задач, статусов и действий.
 * Работает с localStorage для хранения данных.
 *
 * Примеры использования:
 * AdminDashboardAPI.logTask({
 *     type: 'Chat Monitoring',
 *     description: 'Поиск чата "Тесты" в архиве',
 *     status: 'CORRECTING',
 *     actions: 'Проверена директория D:\\...',
 *     result: 'Требуется уточнение от пользователя'
 * });
 *
 * AdminDashboardAPI.updateTask(taskId, {
 *     status: 'COMPLETED',
 *     result: 'Чат найден и восстановлен'
 * });
 */

const AdminDashboardAPI = {
    // Добавить новую задачу
    logTask: function(taskData) {
        const tasks = this._getTasks();
        const newTask = {
            id: Date.now(),
            timestamp: this._getTimestamp(),
            type: taskData.type || 'Task',
            description: taskData.description || '',
            status: taskData.status || 'ACTIVE',
            actions: taskData.actions || '',
            result: taskData.result || ''
        };
        tasks.unshift(newTask);
        this._saveTasks(tasks);
        console.log('[ADMIN-DASHBOARD] Task logged:', newTask);
        return newTask.id;
    },

    // Обновить существующую задачу
    updateTask: function(taskId, updates) {
        const tasks = this._getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            Object.assign(task, updates);
            this._saveTasks(tasks);
            console.log('[ADMIN-DASHBOARD] Task updated:', task);
            return true;
        }
        return false;
    },

    // Добавить действие к задаче
    addAction: function(taskId, action) {
        const tasks = this._getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.actions = task.actions ? task.actions + ' → ' + action : action;
            this._saveTasks(tasks);
            return true;
        }
        return false;
    },

    // Установить результат задачи
    setResult: function(taskId, result) {
        return this.updateTask(taskId, { result: result });
    },

    // Изменить статус задачи
    setStatus: function(taskId, status) {
        return this.updateTask(taskId, { status: status });
    },

    // Быстрое логирование с автоматическим статусом
    logSuccess: function(description, actions = '', result = 'Успешно') {
        return this.logTask({
            type: 'Action',
            description: description,
            status: 'COMPLETED',
            actions: actions,
            result: result
        });
    },

    logError: function(description, actions = '', result = 'Ошибка') {
        return this.logTask({
            type: 'Error',
            description: description,
            status: 'ERROR',
            actions: actions,
            result: result
        });
    },

    logCorrection: function(description, actions = '') {
        return this.logTask({
            type: 'Correction',
            description: description,
            status: 'CORRECTING',
            actions: actions,
            result: 'Исправление...'
        });
    },

    // Получить все задачи
    getTasks: function() {
        return this._getTasks();
    },

    // Получить задачу по ID
    getTask: function(taskId) {
        return this._getTasks().find(t => t.id === taskId);
    },

    // Получить задачи по статусу
    getTasksByStatus: function(status) {
        return this._getTasks().filter(t => t.status === status);
    },

    // Получить статистику
    getStats: function() {
        const tasks = this._getTasks();
        return {
            total: tasks.length,
            active: tasks.filter(t => t.status === 'ACTIVE').length,
            completed: tasks.filter(t => t.status === 'COMPLETED').length,
            correcting: tasks.filter(t => t.status === 'CORRECTING').length,
            error: tasks.filter(t => t.status === 'ERROR').length
        };
    },

    // Очистить все задачи (для отладки)
    clearAll: function() {
        localStorage.removeItem('adminTasks');
        console.log('[ADMIN-DASHBOARD] All tasks cleared');
    },

    // === ПРИВАТНЫЕ МЕТОДЫ ===

    _getTasks: function() {
        const stored = localStorage.getItem('adminTasks');
        return stored ? JSON.parse(stored) : [];
    },

    _saveTasks: function(tasks) {
        localStorage.setItem('adminTasks', JSON.stringify(tasks));
    },

    _getTimestamp: function() {
        const now = new Date();
        return now.toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

// Экспорт для Node.js (если нужно)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminDashboardAPI;
}
