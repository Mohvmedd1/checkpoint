document.addEventListener('DOMContentLoaded', () => {

    const sidebarLinks = document.querySelectorAll('.nav-item');
    const taskViews = document.querySelectorAll('.task-view');
    const viewTitleContainer = document.getElementById('view-title');
    const openModalBtn = document.getElementById('open-add-task-modal');
    const modal = document.getElementById('add-task-modal');
    const closeModalBtn = document.getElementById('close-add-task-modal');
    const cancelModalBtn = document.getElementById('cancel-add-task');
    const taskForm = document.getElementById('add-task-form');

    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const dueDateInput = document.getElementById('due-date');
    const categoryInput = document.getElementById('category');
    const priorityInput = document.getElementById('priority-input');
    const tagsInput = document.getElementById('tags');
    const statusInput = document.getElementById('status');

    const myDayTasksContainer = document.getElementById('my-day-tasks');
    const importantTasksContainer = document.getElementById('important-tasks');
    const plannedTasksContainer = document.getElementById('planned-view');
    const allTasksContainer = document.getElementById('all-tasks-view');

    const myDayProgressText = document.getElementById('my-day-progress-text');
    const myDayProgressBar = document.getElementById('my-day-progress-bar');
    const importantProgressText = document.getElementById('important-progress-text');
    const importantProgressBar = document.getElementById('important-progress-bar');
    
    let tasks = []; 

    let currentView = 'my-day';

    const viewDetails = {
        'my-day': { 
            title: 'My Day', 
            date: getFormattedDate(new Date()),
            icon: 'fa-solid fa-sun' 
        },
        'important': { 
            title: 'Important', 
            subtitle: (count) => `${count} tasks starred`,
            icon: 'fa-solid fa-star' 
        },
        'planned': { 
            title: 'Planned', 
            subtitle: (count) => `${count} tasks scheduled`,
            icon: 'fa-solid fa-calendar-alt' 
        },
        'all-tasks': { 
            title: 'All Tasks', 
            subtitle: (count, completed) => `${count} total • ${completed} completed`,
            icon: 'fa-solid fa-tasks' 
        }
    };


    function getFormattedDate(date) {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    const getToday = () => new Date().setHours(0, 0, 0, 0);
    const isToday = (date) => date.setHours(0, 0, 0, 0) === getToday();
    const isTomorrow = (date) => date.setHours(0, 0, 0, 0) === getToday() + 86400000;
    const isOverdue = (date) => date.setHours(0, 0, 0, 0) < getToday();
    
    const isThisWeek = (date) => {
        const d = date.setHours(0, 0, 0, 0);
        const today = getToday();
        const tomorrow = today + 86400000;
        const nextWeek = today + 7 * 86400000;
        return d > tomorrow && d <= nextWeek;
    };


    function renderTasks() {
        taskViews.forEach(view => view.style.display = 'none');
        
        document.getElementById(`${currentView}-view`).style.display = 'block';

        updateViewTitle();

        switch (currentView) {
            case 'my-day':
                renderMyDayTasks();
                break;
            case 'important':
                renderImportantTasks();
                break;
            case 'planned':
                renderPlannedTasks();
                break;
            case 'all-tasks':
                renderAllTasks();
                break;
        }
    }

    function updateViewTitle() {
        const details = viewDetails[currentView];
        let subtitle = '';

        if (currentView === 'my-day') {
            subtitle = details.date;
        } else if (currentView === 'important') {
            const count = tasks.filter(t => t.isImportant).length;
            subtitle = details.subtitle(count);
        } else if (currentView === 'planned') {
            const count = tasks.filter(t => t.dueDate).length;
            subtitle = details.subtitle(count);
        } else if (currentView === 'all-tasks') {
            const count = tasks.length;
            const completed = tasks.filter(t => t.isCompleted).length;
            subtitle = details.subtitle(count, completed);
        }

        viewTitleContainer.innerHTML = `
            <i class="${details.icon} title-icon"></i>
            <div class="title-text">
                <h2>${details.title}</h2>
                <span>${subtitle}</span>
            </div>
        `;
    }

    function renderMyDayTasks() {
        myDayTasksContainer.innerHTML = '';
        const today = getToday();
        const myDayTasks = tasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate).setHours(0, 0, 0, 0);
            return taskDate === today;
        });

        if (myDayTasks.length === 0) {
            myDayTasksContainer.innerHTML = '<p class="empty-list-msg">Tasks for today will appear here.</p>';
        } else {
            myDayTasks.forEach(task => {
                myDayTasksContainer.appendChild(createTaskElement(task));
            });
        }
        updateProgressBar(myDayTasks, myDayProgressBar, myDayProgressText);
    }

    function renderImportantTasks() {
        importantTasksContainer.innerHTML = '';
        const importantTasks = tasks.filter(task => task.isImportant);

        if (importantTasks.length === 0) {
            importantTasksContainer.innerHTML = '<p class="empty-list-msg">Starred tasks will appear here.</p>';
        } else {
            importantTasks.forEach(task => {
                importantTasksContainer.appendChild(createTaskElement(task));
            });
        }
        updateProgressBar(importantTasks, importantProgressBar, importantProgressText);
    }

    function renderPlannedTasks() {
        plannedTasksContainer.innerHTML = '';
        
        const overdueTasks = tasks.filter(t => t.dueDate && !t.isCompleted && isOverdue(new Date(t.dueDate)));
        const todayTasks = tasks.filter(t => t.dueDate && isToday(new Date(t.dueDate)));
        const tomorrowTasks = tasks.filter(t => t.dueDate && isTomorrow(new Date(t.dueDate)));
        const thisWeekTasks = tasks.filter(t => t.dueDate && isThisWeek(new Date(t.dueDate)));

        plannedTasksContainer.appendChild(createTaskGroup('Overdue', overdueTasks));
        plannedTasksContainer.appendChild(createTaskGroup('Today', todayTasks));
        plannedTasksContainer.appendChild(createTaskGroup('Tomorrow', tomorrowTasks));
        plannedTasksContainer.appendChild(createTaskGroup('This Week', thisWeekTasks));
    }

    function renderAllTasks() {
        allTasksContainer.innerHTML = '';
        
        const workTasks = tasks.filter(t => t.category === 'Work');
        const personalTasks = tasks.filter(t => t.category === 'Personal');

        allTasksContainer.appendChild(createTaskGroup('Work', workTasks));
        allTasksContainer.appendChild(createTaskGroup('Personal', personalTasks));
    }

    function createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.isCompleted ? 'completed' : ''}`;
        taskItem.dataset.id = task.id;

        const taskDate = task.dueDate ? new Date(task.dueDate) : null;
        let dateString = '';
        let dateClass = '';

        if (taskDate) {
            const today = getToday();
            const taskTime = taskDate.setHours(0, 0, 0, 0);

            if (isToday(taskDate)) {
                dateString = 'Today';
            } else if (isTomorrow(taskDate)) {
                dateString = 'Tomorrow';
            } else {
                dateString = taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }

            if (!task.isCompleted && taskTime < today) {
                dateClass = 'overdue';
            }
        }

        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.isCompleted ? 'checked' : ''}>
            <div class="task-content">
                <span class="task-title">${task.title}</span>
                <div class="task-details">
                    <span>${task.category}</span>
                    ${dateString ? `
                        <span class="due-date ${dateClass}">
                            <i class="fa-regular fa-calendar"></i> ${dateString}
                        </span>` : ''
                    }
                </div>
            </div>
            <i class="task-star ${task.isImportant ? 'fa-solid fa-star important' : 'fa-regular fa-star'}"></i>
        `;
        return taskItem;
    }

    function createTaskGroup(title, taskList) {
        const groupWrapper = document.createElement('div');
        groupWrapper.className = 'task-group';

        if (taskList.length === 0) {
            if(currentView !== 'planned') {
                return groupWrapper;
            }
        }

        const header = document.createElement('h3');
        header.className = 'task-group-header';
        header.innerHTML = `${title} <span class="count">${taskList.length}</span>`;
        groupWrapper.appendChild(header);

        const list = document.createElement('div');
        list.className = 'task-list';
        taskList.forEach(task => {
            list.appendChild(createTaskElement(task));
        });
        
        if (taskList.length === 0) {
             list.innerHTML = `<p class="empty-list-msg-small">No tasks ${title.toLowerCase()}.</p>`;
        }
        
        groupWrapper.appendChild(list);
        return groupWrapper;
    }

    function updateProgressBar(tasks, barElement, textElement) {
        const completedTasks = tasks.filter(t => t.isCompleted).length;
        const totalTasks = tasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        barElement.style.width = `${progress}%`;
        textElement.textContent = `${completedTasks} of ${totalTasks} completed`;
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            currentView = link.dataset.view;
            renderTasks();
        });
    });

    function showModal() {
        modal.style.display = 'flex';
    }
    function hideModal() {
        modal.style.display = 'none';
        taskForm.reset();
        resetPriorityButtons();
    }

    openModalBtn.addEventListener('click', showModal);
    closeModalBtn.addEventListener('click', hideModal);
    cancelModalBtn.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = titleInput.value.trim();
        if (title === '') {
            alert('Title is required!');
            return;
        }

        const activePriorityBtn = priorityInput.querySelector('.priority-btn.active');
        const priority = activePriorityBtn ? activePriorityBtn.dataset.priority : 'Medium';

        const newTask = {
            id: Date.now().toString(),
            title: title,
            description: descriptionInput.value.trim(),
            dueDate: dueDateInput.value,
            category: categoryInput.value,
            priority: priority,
            tags: tagsInput.value.trim(),
            status: statusInput.value,
            isCompleted: false,
            isImportant: false
        };

        tasks.push(newTask);
        
        renderTasks();
        
        hideModal();
    });

    document.querySelector('.task-views-container').addEventListener('click', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;

        const taskId = taskItem.dataset.id;
        const task = tasks.find(t => t.id === taskId);

        if (e.target.classList.contains('task-checkbox')) {
            task.isCompleted = e.target.checked;
        }

        if (e.target.classList.contains('task-star')) {
            task.isImportant = !task.isImportant;
        }
        renderTasks();
    });

    renderTasks();
    
    priorityInput.addEventListener('click', (e) => {
        if (e.target.classList.contains('priority-btn')) {
            resetPriorityButtons();
            e.target.classList.add('active');
        }
    });

    function resetPriorityButtons() {
        priorityInput.querySelectorAll('.priority-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const mediumBtn = priorityInput.querySelector('[data-priority="Medium"]');
        if (mediumBtn) {
            mediumBtn.classList.add('active');
        }
    }
});