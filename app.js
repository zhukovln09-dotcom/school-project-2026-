// app.js - Основное приложение с Firebase
import { firestoreService, getAuth } from './firebase-app.js';

class CrowdsourcingApp {
    constructor() {
        this.ideas = [];
        this.currentFilter = 'all';
        this.userId = null;
        this.unsubscribeIdeas = null;
        this.init();
    }

    // Инициализация приложения
    async init() {
        try {
            // Ждем инициализации Firebase
            await this.waitForFirebaseAuth();
            
            // Получаем ID пользователя
            const auth = getAuth();
            this.userId = auth.currentUser ? auth.currentUser.uid : 'anonymous';
            
            // Загружаем идеи
            await this.loadIdeas();
            
            // Настраиваем подписку на обновления в реальном времени
            this.setupRealtimeUpdates();
            
            // Настраиваем обработчики событий
            this.setupEventListeners();
            
            // Обновляем статистику
            await this.updateStats();
            
            // Настраиваем счетчики символов
            this.setupCharacterCounters();
            
            // Загружаем рейтинг
            await this.loadLeaderboard();
            
            // Настраиваем тему
            this.setupTheme();
            
            console.log('Приложение успешно инициализировано');
        } catch (error) {
            console.error('Ошибка инициализации приложения:', error);
            this.showNotification('Ошибка загрузки данных. Проверьте подключение к интернету.', 'warning');
            this.loadFallbackData();
        }
    }

    // Ожидание инициализации Firebase Auth
    waitForFirebaseAuth() {
        return new Promise((resolve) => {
            const auth = getAuth();
            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve();
            });
        });
    }

    // Загрузка идей из Firestore
    async loadIdeas() {
        try {
            this.ideas = await firestoreService.getAllIdeas({
                sortBy: this.currentFilter === 'popular' ? 'votes' : 'createdAt'
            });
            this.renderIdeas();
        } catch (error) {
            console.error('Ошибка загрузки идей:', error);
            throw error;
        }
    }

    // Настройка обновлений в реальном времени
    setupRealtimeUpdates() {
        const filters = {};
        
        if (this.currentFilter === 'new') {
            filters.status = 'new';
        } else if (this.currentFilter === 'popular') {
            filters.status = 'popular';
        } else if (this.currentFilter === 'implemented') {
            filters.implemented = true;
        }
        
        // Отписываемся от предыдущей подписки, если есть
        if (this.unsubscribeIdeas) {
            this.unsubscribeIdeas();
        }
        
        // Подписываемся на обновления
        this.unsubscribeIdeas = firestoreService.subscribeToIdeas(
            (ideas) => {
                this.ideas = ideas;
                this.renderIdeas();
                this.updateStats();
                this.loadLeaderboard();
            },
            filters
        );
    }

    // Загрузка данных из localStorage при ошибке
    loadFallbackData() {
        const savedIdeas = localStorage.getItem('schoolIdeas');
        
        if (savedIdeas) {
            this.ideas = JSON.parse(savedIdeas);
            this.renderIdeas();
            this.updateStatsFromLocalData();
            this.showNotification('Используются локальные данные', 'warning');
        } else {
            this.ideas = this.getDemoIdeas();
            this.renderIdeas();
            this.updateStatsFromLocalData();
        }
    }

    // Демо-данные
    getDemoIdeas() {
        return [
            {
                id: 'demo1',
                title: "Установка кулеров с водой на каждом этаже",
                description: "Предлагаю установить кулеры с питьевой водой на каждом этаже школы...",
                category: "infrastructure",
                authorName: "Анна С.",
                authorClass: "10А",
                votes: 24,
                createdAt: { seconds: 1694710800, nanoseconds: 0 },
                status: "popular",
                implemented: false
            },
            {
                id: 'demo2',
                title: "Организация школьного книгообмена",
                description: "Создать полку в библиотеке, где ученики могут оставлять прочитанные книги...",
                category: "education",
                authorName: "Максим К.",
                authorClass: "9Б",
                votes: 18,
                createdAt: { seconds: 1696251600, nanoseconds: 0 },
                status: "new",
                implemented: false
            }
        ];
    }

    // Рендеринг идей на странице
    renderIdeas() {
        const container = document.getElementById('ideas-container');
        
        if (!container) return;
        
        // Фильтрация идей (если не используется реальное время)
        let filteredIdeas = [...this.ideas];
        
        if (!this.unsubscribeIdeas) {
            if (this.currentFilter === 'new') {
                filteredIdeas = filteredIdeas.filter(idea => idea.status === 'new');
            } else if (this.currentFilter === 'popular') {
                filteredIdeas = filteredIdeas.filter(idea => idea.status === 'popular');
            } else if (this.currentFilter === 'implemented') {
                filteredIdeas = filteredIdeas.filter(idea => idea.implemented);
            }
        }
        
        // Сортировка по количеству голосов (по убыванию)
        filteredIdeas.sort((a, b) => (b.votes || 0) - (a.votes || 0));
        
        if (filteredIdeas.length === 0) {
            container.innerHTML = `
                <div class="no-ideas">
                    <i class="fas fa-lightbulb"></i>
                    <h3>Идей пока нет</h3>
                    <p>Будьте первым, кто предложит идею для улучшения школы!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredIdeas.map(idea => this.createIdeaCard(idea)).join('');
        
        // Добавляем обработчики событий для кнопок голосования
        document.querySelectorAll('.vote-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const ideaId = button.dataset.id;
                await this.voteForIdea(ideaId);
            });
        });
        
        // Добавляем обработчики для открытия модального окна
        document.querySelectorAll('.idea-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.vote-btn')) {
                    const ideaId = card.dataset.id;
                    this.openIdeaModal(ideaId);
                }
            });
        });
    }

    // Создание карточки идеи
    createIdeaCard(idea) {
        const categoryNames = {
            infrastructure: 'Инфраструктура',
            education: 'Учебный процесс',
            events: 'Мероприятия',
            sport: 'Спорт и здоровье',
            other: 'Другое'
        };
        
        // Проверяем, голосовал ли пользователь (асинхронно обновим позже)
        const voteBtnClass = 'vote-btn';
        const voteBtnText = 'Голосовать';
        
        // Форматируем дату
        let dateString = 'Недавно';
        if (idea.createdAt && idea.createdAt.seconds) {
            const date = new Date(idea.createdAt.seconds * 1000);
            dateString = date.toLocaleDateString('ru-RU');
        }
        
        let statusBadge = '';
        if (idea.implemented) {
            statusBadge = '<div class="idea-status status-implemented"><i class="fas fa-check-circle"></i> Реализовано</div>';
        } else if (idea.status === 'popular') {
            statusBadge = '<div class="idea-status status-popular"><i class="fas fa-fire"></i> Популярная</div>';
        } else if (idea.status === 'new') {
            statusBadge = '<div class="idea-status status-new"><i class="fas fa-star"></i> Новая</div>';
        }
        
        return `
            <div class="idea-card" data-id="${idea.id}">
                <div class="idea-header">
                    <div>
                        <h3 class="idea-title">${idea.title}</h3>
                        <span class="idea-category">${categoryNames[idea.category] || idea.category}</span>
                    </div>
                </div>
                <p class="idea-description">${idea.description}</p>
                ${statusBadge}
                <div class="idea-footer">
                    <div class="idea-author">
                        <i class="fas fa-user"></i>
                        <span>${idea.authorName || 'Аноним'} ${idea.authorClass ? `, ${idea.authorClass}` : ''}</span>
                        <span class="idea-date">${dateString}</span>
                    </div>
                    <div class="idea-votes">
                        <button class="${voteBtnClass}" data-id="${idea.id}">
                            <i class="fas fa-thumbs-up"></i> ${voteBtnText}
                        </button>
                        <span class="vote-count">${idea.votes || 0}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Голосование за идею
    async voteForIdea(ideaId) {
        try {
            // Проверяем, голосовал ли пользователь
            const hasVoted = await firestoreService.hasUserVoted(ideaId, this.userId);
            
            if (hasVoted) {
                this.showNotification('Вы уже голосовали за эту идею!', 'warning');
                return;
            }
            
            // Обновляем UI перед отправкой
            const button = document.querySelector(`.vote-btn[data-id="${ideaId}"]`);
            const countElement = button?.nextElementSibling;
            
            if (button && countElement) {
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Голосование...';
            }
            
            // Отправляем голос
            await firestoreService.voteForIdea(ideaId, this.userId);
            
            // Успешное голосование
            this.showNotification('Ваш голос учтен!', 'success');
            
            // Обновляем кнопку
            if (button) {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-thumbs-up"></i> Голос отдан';
                button.classList.add('voted');
            }
            
        } catch (error) {
            console.error('Ошибка голосования:', error);
            
            // Восстанавливаем UI
            const button = document.querySelector(`.vote-btn[data-id="${ideaId}"]`);
            if (button) {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-thumbs-up"></i> Голосовать';
            }
            
            this.showNotification(error.message || 'Ошибка при голосовании', 'warning');
        }
    }

    // Открытие модального окна с деталями идеи
    async openIdeaModal(ideaId) {
        try {
            const idea = await firestoreService.getIdeaById(ideaId);
            if (!idea) {
                this.showNotification('Идея не найдена', 'warning');
                return;
            }
            
            // Проверяем, голосовал ли пользователь
            const hasVoted = await firestoreService.hasUserVoted(ideaId, this.userId);
            
            this.renderIdeaModal(idea, hasVoted);
        } catch (error) {
            console.error('Ошибка открытия модального окна:', error);
            this.showNotification('Не удалось загрузить данные идеи', 'warning');
        }
    }

    // Рендеринг модального окна
    renderIdeaModal(idea, hasVoted) {
        const categoryNames = {
            infrastructure: 'Инфраструктура',
            education: 'Учебный процесс',
            events: 'Мероприятия',
            sport: 'Спорт и здоровье',
            other: 'Другое'
        };
        
        // Форматируем дату
        let dateString = 'Недавно';
        if (idea.createdAt && idea.createdAt.seconds) {
            const date = new Date(idea.createdAt.seconds * 1000);
            dateString = date.toLocaleDateString('ru-RU');
        }
        
        const statusText = idea.implemented ? 
            '<span class="status-implemented"><i class="fas fa-check-circle"></i> Реализовано</span>' : 
            (idea.status === 'popular' ? 
                '<span class="status-popular"><i class="fas fa-fire"></i> Популярная идея</span>' : 
                '<span class="status-new"><i class="fas fa-star"></i> Новая идея</span>');
        
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <div class="modal-idea">
                <h2>${idea.title}</h2>
                <div class="modal-meta">
                    <span><i class="fas fa-tag"></i> ${categoryNames[idea.category] || idea.category}</span>
                    <span><i class="fas fa-user"></i> ${idea.authorName || 'Аноним'} ${idea.authorClass ? `, ${idea.authorClass}` : ''}</span>
                    <span><i class="fas fa-calendar"></i> ${dateString}</span>
                    <span><i class="fas fa-thumbs-up"></i> ${idea.votes || 0} голосов</span>
                </div>
                <div class="modal-status">${statusText}</div>
                <div class="modal-description">
                    <h3><i class="fas fa-align-left"></i> Описание идеи</h3>
                    <p>${idea.description}</p>
                </div>
                <div class="modal-actions">
                    <button class="btn-primary vote-btn-modal" data-id="${idea.id}" ${hasVoted ? 'disabled' : ''}>
                        <i class="fas fa-thumbs-up"></i> 
                        ${hasVoted ? 'Голос отдан' : 'Поддержать идею'}
                    </button>
                    <button class="btn-secondary modal-close-btn">Закрыть</button>
                </div>
            </div>
        `;
        
        // Открываем модальное окно
        const modal = document.getElementById('idea-modal');
        modal.classList.add('active');
        
        // Добавляем обработчики событий
        const voteBtn = document.querySelector('.vote-btn-modal');
        if (voteBtn && !hasVoted) {
            voteBtn.addEventListener('click', async () => {
                await this.voteForIdea(idea.id);
                modal.classList.remove('active');
            });
        }
        
        document.querySelector('.modal-close-btn').addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        // Закрытие по клику на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
        
        // Закрытие по кнопке закрытия
        document.querySelector('.modal-close').addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    // Добавление новой идеи
    async addNewIdea(ideaData) {
        try {
            // Валидация
            if (!ideaData.title || ideaData.title.length < 5) {
                throw new Error('Название должно содержать минимум 5 символов');
            }
            
            if (!ideaData.description || ideaData.description.length < 20) {
                throw new Error('Описание должно содержать минимум 20 символов');
            }
            
            if (!ideaData.category) {
                throw new Error('Выберите категорию');
            }
            
            // Подготовка данных для Firestore
            const firestoreIdeaData = {
                title: ideaData.title,
                description: ideaData.description,
                category: ideaData.category,
                authorName: ideaData.author || 'Аноним',
                authorClass: ideaData.class || '',
                status: 'new',
                implemented: false,
                votes: 0
            };
            
            // Отправляем в Firestore
            const newIdea = await firestoreService.createIdea(firestoreIdeaData);
            
            // Обновляем локальные данные
            this.ideas.unshift(newIdea);
            
            // Показываем уведомление
            this.showNotification('Идея успешно добавлена!', 'success');
            
            // Очищаем форму
            this.clearForm();
            
            // Прокручиваем к секции с идеями
            document.getElementById('ideas').scrollIntoView({ behavior: 'smooth' });
            
            return newIdea;
        } catch (error) {
            console.error('Ошибка добавления идеи:', error);
            this.showNotification(error.message || 'Ошибка при добавлении идеи', 'warning');
            throw error;
        }
    }

    // Обновление статистики
    async updateStats() {
        try {
            const stats = await firestoreService.getStats();
            
            document.getElementById('total-ideas').textContent = stats.totalIdeas || 0;
            document.getElementById('total-votes').textContent = stats.totalVotes || 0;
            document.getElementById('implemented-ideas').textContent = stats.implementedIdeas || 0;
        } catch (error) {
            console.error('Ошибка обновления статистики:', error);
            // Используем локальные данные
            this.updateStatsFromLocalData();
        }
    }

    // Обновление статистики из локальных данных
    updateStatsFromLocalData() {
        const totalIdeas = this.ideas.length;
        const totalVotes = this.ideas.reduce((sum, idea) => sum + (idea.votes || 0), 0);
        const implementedIdeas = this.ideas.filter(idea => idea.implemented).length;
        
        document.getElementById('total-ideas').textContent = totalIdeas;
        document.getElementById('total-votes').textContent = totalVotes;
        document.getElementById('implemented-ideas').textContent = implementedIdeas;
    }

    // Загрузка рейтинга
    async loadLeaderboard() {
        try {
            const leaderboard = await firestoreService.getLeaderboard(10);
            this.renderLeaderboard(leaderboard);
        } catch (error) {
            console.error('Ошибка загрузки рейтинга:', error);
            this.renderLeaderboard([]);
        }
    }

    // Рендеринг таблицы рейтинга
    renderLeaderboard(leaderboard) {
        const tbody = document.getElementById('leaderboard-body');
        
        if (!tbody) return;
        
        if (leaderboard.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <i class="fas fa-users" style="font-size: 2rem; color: var(--gray-color); margin-bottom: 15px; display: block;"></i>
                        <p>Пока нет активных участников</p>
                        <p>Предложите первую идею!</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = leaderboard.map((user, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${user.name}</td>
                <td>${user.class || '-'}</td>
                <td>${user.ideasCount}</td>
                <td>${user.totalVotes}</td>
                <td>${user.score}</td>
            </tr>
        `).join('');
    }

    // Настройка темы
    setupTheme() {
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-theme');
            document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
        }
        
        // Обработчик переключения темы
        document.getElementById('theme-toggle').addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            
            const icon = document.querySelector('#theme-toggle i');
            if (document.body.classList.contains('dark-theme')) {
                icon.className = 'fas fa-sun';
                localStorage.setItem('theme', 'dark');
            } else {
                icon.className = 'fas fa-moon';
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // Настройка счетчиков символов
    setupCharacterCounters() {
        const titleInput = document.getElementById('idea-title');
        const descInput = document.getElementById('idea-description');
        const titleChars = document.getElementById('title-chars');
        const descChars = document.getElementById('desc-chars');
        
        if (titleInput && titleChars) {
            titleInput.addEventListener('input', () => {
                titleChars.textContent = titleInput.value.length;
            });
        }
        
        if (descInput && descChars) {
            descInput.addEventListener('input', () => {
                descChars.textContent = descInput.value.length;
            });
        }
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Фильтрация идей
        document.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', () => {
                // Убираем активный класс у всех кнопок
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Добавляем активный класс текущей кнопке
                button.classList.add('active');
                
                // Устанавливаем текущий фильтр
                this.currentFilter = button.dataset.filter;
                
                // Обновляем подписку на реальное время
                this.setupRealtimeUpdates();
            });
        });
        
        // Отправка формы
        const submitButton = document.getElementById('submit-idea');
        if (submitButton) {
            submitButton.addEventListener('click', () => {
                this.submitIdea();
            });
        }
        
        // Отправка формы по нажатию Enter
        const titleInput = document.getElementById('idea-title');
        if (titleInput) {
            titleInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.submitIdea();
                }
            });
        }
        
        // Закрытие модального окна
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                document.getElementById('idea-modal').classList.remove('active');
            });
        }
    }

    // Обработка отправки формы
    async submitIdea() {
        const title = document.getElementById('idea-title')?.value.trim() || '';
        const description = document.getElementById('idea-description')?.value.trim() || '';
        const category = document.getElementById('idea-category')?.value || 'other';
        const author = document.getElementById('idea-author')?.value.trim() || '';
        const userClass = document.getElementById('idea-class')?.value.trim() || '';
        
        const ideaData = {
            title,
            description,
            category,
            author,
            class: userClass
        };
        
        try {
            // Показываем индикатор загрузки
            const submitButton = document.getElementById('submit-idea');
            const originalText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
            
            await this.addNewIdea(ideaData);
            
            // Восстанавливаем кнопку
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
            
        } catch (error) {
            // Восстанавливаем кнопку при ошибке
            const submitButton = document.getElementById('submit-idea');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Отправить идею';
            }
        }
    }

    // Очистка формы
    clearForm() {
        const titleInput = document.getElementById('idea-title');
        const descInput = document.getElementById('idea-description');
        const authorInput = document.getElementById('idea-author');
        const classInput = document.getElementById('idea-class');
        const categorySelect = document.getElementById('idea-category');
        const titleChars = document.getElementById('title-chars');
        const descChars = document.getElementById('desc-chars');
        
        if (titleInput) titleInput.value = '';
        if (descInput) descInput.value = '';
        if (authorInput) authorInput.value = '';
        if (classInput) classInput.value = '';
        if (categorySelect) categorySelect.selectedIndex = 0;
        if (titleChars) titleChars.textContent = '0';
        if (descChars) descChars.textContent = '0';
    }

    // Показать уведомление
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        const icon = notification.querySelector('i');
        
        if (!notification || !notificationText) return;
        
        // Устанавливаем текст и иконку
        notificationText.textContent = message;
        
        if (type === 'success') {
            icon.className = 'fas fa-check-circle';
            notification.style.backgroundColor = 'var(--primary-color)';
        } else if (type === 'warning') {
            icon.className = 'fas fa-exclamation-triangle';
            notification.style.backgroundColor = 'var(--warning-color)';
        }
        
        // Показываем уведомление
        notification.classList.add('active');
        
        // Скрываем через 3 секунды
        setTimeout(() => {
            notification.classList.remove('active');
        }, 3000);
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Ждем загрузки Firebase
    setTimeout(() => {
        window.app = new CrowdsourcingApp();
    }, 100);
});
