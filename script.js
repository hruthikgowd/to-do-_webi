document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));

    // Redirect to setup if no profile
    if (!user) {
        window.location.href = 'auth.html';
        return;
    }

    // DOM Elements
    const form = document.getElementById('todo-form');
    const input = document.getElementById('todo-input');
    const prioritySelect = document.getElementById('priority-select');
    const categorySelect = document.getElementById('category-select');
    const dueDateInput = document.getElementById('due-date');
    const searchInput = document.getElementById('search-input');
    const themeToggle = document.getElementById('theme-toggle');
    const voiceBtn = document.getElementById('voice-btn');
    const aboutBtn = document.getElementById('about-btn');
    const aboutModal = document.getElementById('about-modal');
    const closeAbout = document.querySelector('.close-modal');
    const todoList = document.getElementById('todo-list');
    const itemsLeft = document.getElementById('items-left');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const dateDisplay = document.getElementById('date-display');
    
    // Stats Elements
    const statTotal = document.getElementById('stat-total');
    const statCompleted = document.getElementById('stat-completed');
    const statProductivity = document.getElementById('stat-productivity');
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');

    // Add Logout Button dynamically
    const headerActions = document.querySelector('.header-actions');
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.title = 'Switch Profile';
    logoutBtn.innerHTML = '<i class="fas fa-user-circle"></i>';
    logoutBtn.className = 'header-btn';
    headerActions.appendChild(logoutBtn);

    // State
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let currentFilter = 'all';
    let searchQuery = '';
    let theme = localStorage.getItem('theme') || 'dark';

    // Initialize
    updateDate();
    applyTheme();
    renderTodos();
    input.focus();
    console.log(`%c✨ Elite To-Do Active: Welcome, ${user.username}!`, "color: #6366f1; font-weight: bold; font-size: 1.2rem;");

    // Event Listeners
    form.addEventListener('submit', addTodo);
    todoList.addEventListener('click', handleTodoClick);
    clearCompletedBtn.addEventListener('click', clearCompleted);
    searchInput.addEventListener('input', handleSearch);
    themeToggle.addEventListener('click', toggleTheme);
    voiceBtn.addEventListener('click', toggleVoiceRecord);
    aboutBtn.addEventListener('click', () => aboutModal.style.display = 'block');
    closeAbout.addEventListener('click', () => aboutModal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === aboutModal) aboutModal.style.display = 'none'; });
    logoutBtn.addEventListener('click', () => {
        if(confirm('Switch profile? All data remains on this device.')) {
            localStorage.removeItem('user');
            window.location.href = 'auth.html';
        }
    });
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTodos();
        });
    });

    // Local Storage Helper
    function saveToLocalStorage() {
        localStorage.setItem('todos', JSON.stringify(todos));
        updateStats();
    }

    // Core Functions
    function addTodo(e) {
        if (e) e.preventDefault();
        const text = input.value.trim();
        const priority = prioritySelect.value;
        const category = categorySelect.value;
        const dueDate = dueDateInput.value;
        
        if (text) {
            const newTodo = {
                _id: Date.now().toString(),
                text,
                completed: false,
                priority: priority,
                category: category,
                dueDate: dueDate,
                subtasks: [],
                createdAt: new Date().toISOString()
            };
            
            todos.push(newTodo);
            saveToLocalStorage();
            renderTodos();
            input.value = '';
            input.focus();
        }
    }

    function toggleTodo(id) {
        todos = todos.map(t => t._id === id ? { ...t, completed: !t.completed } : t);
        saveToLocalStorage();
        renderTodos();
    }

    function deleteTodo(id) {
        todos = todos.filter(t => t._id !== id);
        saveToLocalStorage();
        renderTodos();
    }

    function toggleSubtask(todoId, subtaskId) {
        todos = todos.map(t => {
            if (t._id === todoId) {
                const updatedSubtasks = t.subtasks.map(s => 
                    s.id === subtaskId ? { ...s, completed: !s.completed } : s
                );
                return { ...t, subtasks: updatedSubtasks };
            }
            return t;
        });
        saveToLocalStorage();
        renderTodos();
    }

    function addSubtask(todoId, text) {
        if (!text.trim()) return;
        todos = todos.map(t => {
            if (t._id === todoId) {
                return { 
                    ...t, 
                    subtasks: [...t.subtasks, { id: Date.now().toString(), text, completed: false }] 
                };
            }
            return t;
        });
        saveToLocalStorage();
        renderTodos();
    }

    function clearCompleted() {
        todos = todos.filter(t => !t.completed);
        saveToLocalStorage();
        renderTodos();
    }

    function handleTodoClick(e) {
        const item = e.target.closest('.todo-item');
        if (!item) return;
        const id = item.dataset.id;

        if (e.target.classList.contains('todo-checkbox')) {
            toggleTodo(id);
        }
        
        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            item.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => deleteTodo(id), 300);
        }

        if (e.target.classList.contains('subtask-checkbox')) {
            const subtaskId = e.target.dataset.subid;
            toggleSubtask(id, subtaskId);
        }

        if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
            const textSpan = item.querySelector('.todo-text');
            const originalText = textSpan.textContent;
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'edit-input';
            input.value = originalText;
            input.style.width = '100%';
            input.style.background = 'rgba(255,255,255,0.1)';
            input.style.border = 'none';
            input.style.color = 'white';
            input.style.padding = '5px';
            input.style.borderRadius = '8px';

            textSpan.replaceWith(input);
            input.focus();

            const finishEdit = () => {
                const newText = input.value.trim();
                if (newText && newText !== originalText) {
                    todos = todos.map(t => t._id === id ? { ...t, text: newText } : t);
                    saveToLocalStorage();
                }
                renderTodos();
            };

            input.onblur = finishEdit;
            input.onkeydown = (e) => { if (e.key === 'Enter') finishEdit(); };
        }
    }

    function handleSearch(e) {
        searchQuery = e.target.value.toLowerCase().trim();
        renderTodos();
    }

    function updateDate() {
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        dateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
    }

    function applyTheme() {
        document.documentElement.setAttribute('data-theme', theme);
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }

    function toggleTheme() {
        theme = theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', theme);
        applyTheme();
    }

    function updateStats() {
        const total = todos.length;
        const completed = todos.filter(t => t.completed).length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        statTotal.textContent = total;
        statCompleted.textContent = completed;
        statProductivity.textContent = `${percent}%`;
        
        progressBar.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
    }

    // Voice
    let recognition = null;
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.onresult = (e) => {
            const text = e.results[0][0].transcript;
            input.value = text;
            if (text.toLowerCase().startsWith('add ')) {
                input.value = text.slice(4);
                addTodo();
            }
        };
    }

    function toggleVoiceRecord() {
        if (!recognition) return alert('Speech not supported');
        recognition.start();
    }

    function renderTodos() {
        let filteredTodos = todos;
        
        if (currentFilter === 'active') {
            filteredTodos = todos.filter(todo => !todo.completed);
        } else if (currentFilter === 'completed') {
            filteredTodos = todos.filter(todo => todo.completed);
        }

        if (searchQuery) {
            filteredTodos = filteredTodos.filter(todo => 
                todo.text.toLowerCase().includes(searchQuery)
            );
        }

        const priorityOrder = { high: 0, medium: 1, low: 2 };
        filteredTodos.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        todoList.innerHTML = '';

        if (filteredTodos.length === 0) {
            todoList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-wind"></i>
                    <p>${searchQuery ? 'No matching focus found.' : 'Clear mind. No active focus.'}</p>
                </div>
            `;
        }

        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.dataset.id = todo._id;
            
            li.innerHTML = `
                <div class="todo-main">
                    <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                    <div class="todo-content">
                        <span class="todo-text">${escapeHTML(todo.text)}</span>
                        <div class="todo-meta">
                            ${todo.dueDate ? `<span class="due-date-display"><i class="far fa-calendar"></i> ${formatDate(todo.dueDate)}</span>` : ''}
                            <span class="badge badge-category">${todo.category}</span>
                            <span class="badge badge-${todo.priority}">${todo.priority}</span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="action-btn edit-btn" title="Edit"><i class="fas fa-pen"></i></button>
                        <button class="action-btn delete-btn" title="Delete"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
                <div class="subtasks-container">
                    ${todo.subtasks.map(s => `
                        <div class="subtask-item ${s.completed ? 'completed' : ''}">
                            <input type="checkbox" class="subtask-checkbox" data-subid="${s.id}" ${s.completed ? 'checked' : ''}>
                            <span>${escapeHTML(s.text)}</span>
                        </div>
                    `).join('')}
                    <input type="text" class="add-subtask-input" placeholder="+ Add milestone..." data-todoid="${todo._id}">
                </div>
            `;
            
            // Subtask input handler
            const subInput = li.querySelector('.add-subtask-input');
            subInput.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    addSubtask(todo._id, subInput.value);
                }
            };

            todoList.appendChild(li);
        });

        updateItemsLeft();
        updateStats();
    }

    function updateItemsLeft() {
        const activeCount = todos.filter(todo => !todo.completed).length;
        itemsLeft.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} remain`;
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag] || tag));
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
});
