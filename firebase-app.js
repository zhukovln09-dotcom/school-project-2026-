// firebase-app.js - Инициализация Firebase
import { firebaseConfig } from './firebase-config.js';

let db;
let auth;

// Инициализация Firebase
export function initializeFirebase() {
    try {
        // Инициализация Firebase
        firebase.initializeApp(firebaseConfig);
        
        // Получаем ссылки на сервисы
        db = firebase.firestore();
        auth = firebase.auth();
        
        console.log('Firebase успешно инициализирован');
        
        // Настройка анонимной аутентификации
        setupAnonymousAuth();
        
        return { db, auth };
    } catch (error) {
        console.error('Ошибка инициализации Firebase:', error);
        throw error;
    }
}

// Настройка анонимной аутентификации
async function setupAnonymousAuth() {
    try {
        const user = await auth.currentUser;
        if (!user) {
            // Создаем анонимного пользователя
            await auth.signInAnonymously();
            console.log('Анонимный пользователь создан');
        }
    } catch (error) {
        console.error('Ошибка анонимной аутентификации:', error);
    }
}

// Экспортируем функции для работы с Firebase
export function getFirestore() {
    if (!db) {
        throw new Error('Firebase не инициализирован. Сначала вызовите initializeFirebase()');
    }
    return db;
}

export function getAuth() {
    if (!auth) {
        throw new Error('Firebase не инициализирован. Сначала вызовите initializeFirebase()');
    }
    return auth;
}

// Вспомогательные функции для работы с Firestore
export const firestoreService = {
    // Получение всех идей
    async getAllIdeas(filters = {}) {
        try {
            let query = db.collection('ideas');
            
            // Применяем фильтры
            if (filters.category) {
                query = query.where('category', '==', filters.category);
            }
            
            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }
            
            if (filters.implemented !== undefined) {
                query = query.where('implemented', '==', filters.implemented);
            }
            
            // Применяем сортировку
            if (filters.sortBy === 'votes') {
                query = query.orderBy('votes', 'desc');
            } else {
                query = query.orderBy('createdAt', 'desc');
            }
            
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Ошибка получения идей:', error);
            throw error;
        }
    },
    
    // Получение идеи по ID
    async getIdeaById(id) {
        try {
            const doc = await db.collection('ideas').doc(id).get();
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('Ошибка получения идеи:', error);
            throw error;
        }
    },
    
    // Создание новой идеи
    async createIdea(ideaData) {
        try {
            const user = auth.currentUser;
            const ideaWithMetadata = {
                ...ideaData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: user ? user.uid : 'anonymous',
                votes: 0,
                status: 'new',
                implemented: false
            };
            
            const docRef = await db.collection('ideas').add(ideaWithMetadata);
            return { id: docRef.id, ...ideaWithMetadata };
        } catch (error) {
            console.error('Ошибка создания идеи:', error);
            throw error;
        }
    },
    
    // Голосование за идею
    async voteForIdea(ideaId, userId) {
        try {
            const db = getFirestore();
            
            // Проверяем, голосовал ли пользователь уже
            const voteRef = db.collection('votes').doc(`${userId}_${ideaId}`);
            const voteDoc = await voteRef.get();
            
            if (voteDoc.exists) {
                throw new Error('Вы уже голосовали за эту идею');
            }
            
            // Начинаем транзакцию
            return await db.runTransaction(async (transaction) => {
                // Получаем идею
                const ideaRef = db.collection('ideas').doc(ideaId);
                const ideaDoc = await transaction.get(ideaRef);
                
                if (!ideaDoc.exists) {
                    throw new Error('Идея не найдена');
                }
                
                // Обновляем счетчик голосов
                const currentVotes = ideaDoc.data().votes || 0;
                transaction.update(ideaRef, {
                    votes: currentVotes + 1,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Проверяем и обновляем статус
                if (currentVotes + 1 >= 15) {
                    transaction.update(ideaRef, {
                        status: 'popular'
                    });
                }
                
                // Создаем запись о голосовании
                transaction.set(voteRef, {
                    userId,
                    ideaId,
                    votedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                return currentVotes + 1;
            });
            
        } catch (error) {
            console.error('Ошибка голосования:', error);
            throw error;
        }
    },
    
    // Проверка, голосовал ли пользователь
    async hasUserVoted(ideaId, userId) {
        try {
            const voteRef = db.collection('votes').doc(`${userId}_${ideaId}`);
            const voteDoc = await voteRef.get();
            return voteDoc.exists;
        } catch (error) {
            console.error('Ошибка проверки голоса:', error);
            return false;
        }
    },
    
    // Получение статистики
    async getStats() {
        try {
            const ideasSnapshot = await db.collection('ideas').get();
            const ideas = ideasSnapshot.docs.map(doc => doc.data());
            
            const totalIdeas = ideas.length;
            const totalVotes = ideas.reduce((sum, idea) => sum + (idea.votes || 0), 0);
            const implementedIdeas = ideas.filter(idea => idea.implemented).length;
            const newIdeas = ideas.filter(idea => idea.status === 'new').length;
            const popularIdeas = ideas.filter(idea => idea.status === 'popular').length;
            
            return {
                totalIdeas,
                totalVotes,
                implementedIdeas,
                newIdeas,
                popularIdeas
            };
        } catch (error) {
            console.error('Ошибка получения статистики:', error);
            throw error;
        }
    },
    
    // Получение рейтинга участников
    async getLeaderboard(limit = 10) {
        try {
            const ideasSnapshot = await db.collection('ideas').get();
            const ideas = ideasSnapshot.docs.map(doc => doc.data());
            
            // Группируем по авторам
            const authorStats = {};
            
            ideas.forEach(idea => {
                if (idea.authorName && idea.authorName !== 'Аноним') {
                    const authorKey = `${idea.authorName}_${idea.authorClass || ''}`;
                    
                    if (!authorStats[authorKey]) {
                        authorStats[authorKey] = {
                            name: idea.authorName,
                            class: idea.authorClass || '',
                            ideasCount: 0,
                            totalVotes: 0,
                            score: 0
                        };
                    }
                    
                    authorStats[authorKey].ideasCount++;
                    authorStats[authorKey].totalVotes += idea.votes || 0;
                    authorStats[authorKey].score += (idea.votes || 0) + 5; // 5 очков за каждую идею
                }
            });
            
            // Преобразуем в массив и сортируем
            const leaderboard = Object.values(authorStats)
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
            
            return leaderboard;
        } catch (error) {
            console.error('Ошибка получения рейтинга:', error);
            throw error;
        }
    },
    
    // Подписка на обновления идей в реальном времени
    subscribeToIdeas(callback, filters = {}) {
        try {
            let query = db.collection('ideas');
            
            // Применяем фильтры
            if (filters.category) {
                query = query.where('category', '==', filters.category);
            }
            
            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }
            
            if (filters.implemented !== undefined) {
                query = query.where('implemented', '==', filters.implemented);
            }
            
            // Сортировка
            query = query.orderBy('createdAt', 'desc');
            
            // Возвращаем функцию отписки
            return query.onSnapshot((snapshot) => {
                const ideas = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(ideas);
            }, (error) => {
                console.error('Ошибка подписки на идеи:', error);
            });
        } catch (error) {
            console.error('Ошибка настройки подписки:', error);
            throw error;
        }
    }
};
