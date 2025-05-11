// admin-script.js
document.addEventListener('DOMContentLoaded', () => {
    // Genel DOM Elementleri
    const sidebarLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const contentSections = document.querySelectorAll('.main-content .content-section');
    const currentYearSpan = document.getElementById('current-year');
    const logoutButton = document.getElementById('logout-button');

    // Dashboard İstatistik Elemanları
    const totalPostsStat = document.getElementById('total-posts-stat');
    const totalPagesStat = document.getElementById('total-pages-stat');
    const totalCommentsStat = document.getElementById('total-comments-stat');

    // Yazı Yönetimi DOM Elementleri
    const addPostButton = document.getElementById('add-post-button');
    const postFormModal = document.getElementById('post-form-modal');
    const postForm = document.getElementById('post-form');
    const closePostModalButton = postFormModal ? postFormModal.querySelector('.close-button') : null;
    const cancelPostButton = document.getElementById('cancel-post-button');
    const postListTableBody = document.getElementById('post-list');
    const modalTitle = document.getElementById('modal-title');

    // Sayfa Yönetimi DOM Elementleri
    const addPageButton = document.getElementById('add-page-button');
    const pageFormModal = document.getElementById('page-form-modal');
    const pageForm = document.getElementById('page-form');
    const closePageModalButton = pageFormModal ? pageFormModal.querySelector('.close-page-button') : null;
    const cancelPageButton = document.getElementById('cancel-page-button');
    const pageListTableBody = document.getElementById('page-list');
    const pageModalTitle = document.getElementById('page-modal-title');

    // Yorum Yönetimi DOM Elementleri
    const commentListTableBody = document.getElementById('comment-list');

    // Ayarlar DOM Elementleri
    const settingsForm = document.getElementById('settings-form');

    // localStorage Anahtarları
    const POSTS_KEY = 'adminPosts';
    const PAGES_KEY = 'sitePages';
    const COMMENTS_KEY = 'siteComments';
    const SETTINGS_KEY = 'siteSettings';

    // Global State
    let posts = [];
    let pages = [];
    let comments = [];
    let settings = {};

    // --- YARDIMCI FONKSİYONLAR ---
    function updateYear() {
        const year = new Date().getFullYear();
        if (currentYearSpan) currentYearSpan.textContent = year;
    }

    function switchContent(targetId) {
        contentSections.forEach(section => {
            section.classList.remove('active-content');
            if (section.id === targetId) {
                section.classList.add('active-content');
            }
        });
        sidebarLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.target === targetId) {
                link.classList.add('active');
            }
        });
        // URL hash'i güncelle (isteğe bağlı ama iyi bir UX)
        const hashValue = targetId.replace('-content', '');
        if (window.location.hash !== `#${hashValue}`) {
            // window.location.hash = hashValue; // Sayfa yeniden yüklenmesini tetikleyebilir, dikkatli kullanılmalı
        }
    }

    function handleInitialLoadNavigation() {
        const hash = window.location.hash.substring(1);
        let targetContentId = 'dashboard-content'; // Varsayılan
        if (hash) {
            const potentialTargetId = hash + '-content';
            if (document.getElementById(potentialTargetId)) {
                targetContentId = potentialTargetId;
            }
        }
        switchContent(targetContentId);
    }

    function generateSlug(title) {
        return title.toLowerCase().trim()
            .replace(/[^\w\s-]/g, '') // Alfanümerik olmayanları kaldır
            .replace(/[\s_-]+/g, '-') // Boşlukları/tireleri tek tireye indirge
            .replace(/^-+|-+$/g, ''); // Baştaki/sondaki tireleri kaldır
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('tr-TR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }


    // --- DASHBOARD ---
    function updateDashboardStats() {
        if (totalPostsStat) totalPostsStat.textContent = posts.length;
        if (totalPagesStat) totalPagesStat.textContent = pages.length;
        // Yorumlar için bekleyenleri sayabiliriz veya toplamı
        if (totalCommentsStat) totalCommentsStat.textContent = comments.filter(c => c.status === 'pending').length + ` (Toplam: ${comments.length})`;
    }

    // --- YAZI YÖNETİMİ ---
    function loadPostsFromLocalStorage() {
        const storedPosts = localStorage.getItem(POSTS_KEY);
        if (storedPosts) {
            posts = JSON.parse(storedPosts);
        } else {
            // Örnek yazılar (eğer localStorage boşsa)
            posts = [
                { id: Date.now(), title: "İlk Blog Yazım", excerpt: "Bu benim ilk yazım...", content: "## Merhaba Dünya!\n\nBu **markdown** formatında bir içeriktir.", image: "https://via.placeholder.com/300x200.png?text=Blog+Görseli+1", category: "Teknoloji", date: new Date(Date.now() - 86400000).toISOString(), author: "Yönetici", status: "published", isFeatured: true, commentsEnabled: true },
                { id: Date.now() + 1, title: "İkinci Harika Yazı", excerpt: "Daha fazla içerik burada.", content: "### Başka Bir Başlık\n\n* Liste öğesi 1\n* Liste öğesi 2", image: "https://via.placeholder.com/300x200.png?text=Blog+Görseli+2", category: "Seyahat", date: new Date().toISOString(), author: "Yönetici", status: "draft", isFeatured: false, commentsEnabled: true }
            ];
            savePostsToLocalStorage();
        }
        posts.sort((a, b) => new Date(b.date) - new Date(a.date)); // En yeni en üste
    }

    function savePostsToLocalStorage() {
        localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    }

    function renderPostList() {
        if (!postListTableBody) return;
        postListTableBody.innerHTML = ''; // Listeyi temizle
        if (posts.length === 0) {
            postListTableBody.innerHTML = '<tr><td colspan="7">Gösterilecek yazı bulunamadı.</td></tr>';
            return;
        }
        posts.forEach(post => {
            const row = postListTableBody.insertRow();
            row.innerHTML = `
                <td>${post.id}</td>
                <td>${post.title}</td>
                <td>${post.category || 'N/A'}</td>
                <td>${formatDate(post.date)}</td>
                <td>${post.status || 'N/A'}</td>
                <td>${post.author || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-edit" data-id="${post.id}"><i class="fas fa-edit"></i> Düzenle</button>
                    <button class="btn btn-sm btn-delete" data-id="${post.id}"><i class="fas fa-trash"></i> Sil</button>
                </td>
            `;
        });
        addPostListActionListeners();
        updateDashboardStats();
    }
    
    function addPostListActionListeners() {
        document.querySelectorAll('.btn-edit[data-id]').forEach(button => {
            button.addEventListener('click', (e) => openPostModal(e.currentTarget.dataset.id));
        });
        document.querySelectorAll('.btn-delete[data-id]').forEach(button => {
            button.addEventListener('click', (e) => deletePost(e.currentTarget.dataset.id));
        });
    }

    function openPostModal(postId = null) {
        if (!postFormModal || !postForm) return;
        postForm.reset(); // Formu sıfırla
        document.getElementById('post-id').value = ''; // Gizli ID'yi temizle

        if (postId) {
            const post = posts.find(p => p.id == postId);
            if (post) {
                if(modalTitle) modalTitle.textContent = 'Yazıyı Düzenle';
                document.getElementById('post-id').value = post.id;
                document.getElementById('post-title').value = post.title;
                document.getElementById('post-excerpt').value = post.excerpt || '';
                document.getElementById('post-content').value = post.content || '';
                document.getElementById('post-image').value = post.image || '';
                document.getElementById('post-category').value = post.category || '';
                document.getElementById('post-date').value = post.date ? post.date.substring(0, 16) : ''; // datetime-local formatı için
                document.getElementById('post-author').value = post.author || 'Yönetici';
                document.getElementById('post-status').value = post.status || 'draft';
                document.getElementById('post-is-featured').checked = post.isFeatured || false;
                document.getElementById('post-comments-enabled').checked = post.commentsEnabled === undefined ? true : post.commentsEnabled;
            }
        } else {
            if(modalTitle) modalTitle.textContent = 'Yeni Yazı Ekle';
            document.getElementById('post-author').value = 'Yönetici'; // Varsayılan yazar
            document.getElementById('post-date').value = new Date().toISOString().substring(0, 16); // Varsayılan tarih
            document.getElementById('post-comments-enabled').checked = true; // Varsayılan
        }
        postFormModal.style.display = 'block';
    }

    function handlePostFormSubmit(event) {
        event.preventDefault();
        const postId = document.getElementById('post-id').value;
        const postData = {
            title: document.getElementById('post-title').value,
            excerpt: document.getElementById('post-excerpt').value,
            content: document.getElementById('post-content').value,
            image: document.getElementById('post-image').value,
            category: document.getElementById('post-category').value,
            date: document.getElementById('post-date').value ? new Date(document.getElementById('post-date').value).toISOString() : new Date().toISOString(),
            author: document.getElementById('post-author').value,
            status: document.getElementById('post-status').value,
            isFeatured: document.getElementById('post-is-featured').checked,
            commentsEnabled: document.getElementById('post-comments-enabled').checked
        };

        if (postId) { // Düzenleme
            postData.id = parseInt(postId);
            const index = posts.findIndex(p => p.id == postId);
            if (index !== -1) {
                posts[index] = { ...posts[index], ...postData };
            }
        } else { // Yeni yazı
            postData.id = Date.now(); // Basit bir ID
            posts.push(postData);
        }
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        savePostsToLocalStorage();
        renderPostList();
        if (postFormModal) postFormModal.style.display = 'none';
    }

    function deletePost(postId) {
        if (confirm(`'${posts.find(p=>p.id == postId)?.title || 'Bu yazı'}' başlıklı yazıyı silmek istediğinizden emin misiniz?`)) {
            posts = posts.filter(p => p.id != postId);
            savePostsToLocalStorage();
            renderPostList();
        }
    }

    // --- SAYFA YÖNETİMİ ---
    function loadPagesFromLocalStorage() {
        const storedPages = localStorage.getItem(PAGES_KEY);
        if (storedPages) {
            pages = JSON.parse(storedPages);
        } else {
            pages = [
                { id: Date.now(), title: "Hakkımızda", slug: "hakkimizda", content: "<p>Burası hakkımızda sayfasıdır.</p>" },
                { id: Date.now() + 1, title: "İletişim", slug: "iletisim", content: "<p>Bizimle iletişime geçin.</p>" }
            ];
            savePagesToLocalStorage();
        }
    }

    function savePagesToLocalStorage() {
        localStorage.setItem(PAGES_KEY, JSON.stringify(pages));
    }

    function renderPageList() {
        if (!pageListTableBody) return;
        pageListTableBody.innerHTML = '';
        if (pages.length === 0) {
            pageListTableBody.innerHTML = '<tr><td colspan="4">Gösterilecek sayfa bulunamadı.</td></tr>';
            return;
        }
        pages.forEach(page => {
            const row = pageListTableBody.insertRow();
            row.innerHTML = `
                <td>${page.id}</td>
                <td>${page.title}</td>
                <td>${page.slug || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-edit-page" data-id="${page.id}"><i class="fas fa-edit"></i> Düzenle</button>
                    <button class="btn btn-sm btn-delete-page" data-id="${page.id}"><i class="fas fa-trash"></i> Sil</button>
                </td>
            `;
        });
        addPageListActionListeners();
        updateDashboardStats();
    }
    
    function addPageListActionListeners() {
        document.querySelectorAll('.btn-edit-page[data-id]').forEach(button => {
            button.addEventListener('click', (e) => openPageModal(e.currentTarget.dataset.id));
        });
        document.querySelectorAll('.btn-delete-page[data-id]').forEach(button => {
            button.addEventListener('click', (e) => deletePage(e.currentTarget.dataset.id));
        });
    }

    function openPageModal(pageId = null) {
        if (!pageFormModal || !pageForm) return;
        pageForm.reset();
        document.getElementById('page-id').value = '';

        if (pageId) {
            const page = pages.find(p => p.id == pageId);
            if (page) {
                if(pageModalTitle) pageModalTitle.textContent = 'Sayfayı Düzenle';
                document.getElementById('page-id').value = page.id;
                document.getElementById('page-title').value = page.title;
                document.getElementById('page-slug').value = page.slug || '';
                document.getElementById('page-content').value = page.content || '';
            }
        } else {
            if(pageModalTitle) pageModalTitle.textContent = 'Yeni Sayfa Ekle';
        }
        pageFormModal.style.display = 'block';
    }

    function handlePageFormSubmit(event) {
        event.preventDefault();
        const pageId = document.getElementById('page-id').value;
        const title = document.getElementById('page-title').value;
        let slug = document.getElementById('page-slug').value;
        if (!slug) slug = generateSlug(title);

        const pageData = {
            title: title,
            slug: slug,
            content: document.getElementById('page-content').value
        };

        if (pageId) {
            pageData.id = parseInt(pageId);
            const index = pages.findIndex(p => p.id == pageId);
            if (index !== -1) {
                pages[index] = { ...pages[index], ...pageData };
            }
        } else {
            pageData.id = Date.now();
            pages.push(pageData);
        }
        savePagesToLocalStorage();
        renderPageList();
        if (pageFormModal) pageFormModal.style.display = 'none';
    }

    function deletePage(pageId) {
        if (confirm(`'${pages.find(p=>p.id == pageId)?.title || 'Bu sayfa'}' başlıklı sayfayı silmek istediğinizden emin misiniz?`)) {
            pages = pages.filter(p => p.id != pageId);
            savePagesToLocalStorage();
            renderPageList();
        }
    }

    // --- YORUM YÖNETİMİ ---
    function loadCommentsFromLocalStorage() {
        const storedComments = localStorage.getItem(COMMENTS_KEY);
        if (storedComments) {
            comments = JSON.parse(storedComments);
        } else {
            comments = [
                { id: Date.now(), postId: posts.length > 0 ? posts[0].id : 1, author: "Ziyaretçi Ayşe", text: "Harika bir yazı!", date: new Date(Date.now() - 3600000).toISOString(), status: "pending" },
                { id: Date.now() + 1, postId: posts.length > 0 ? posts[0].id : 1, author: "Eleştirmen Ali", text: "Daha iyi olabilirdi.", date: new Date().toISOString(), status: "approved" }
            ];
            saveCommentsToLocalStorage();
        }
    }

    function saveCommentsToLocalStorage() {
        localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
    }

    function renderCommentList() {
        if (!commentListTableBody) return;
        commentListTableBody.innerHTML = '';
        if (comments.length === 0) {
            commentListTableBody.innerHTML = '<tr><td colspan="7">Gösterilecek yorum bulunamadı.</td></tr>';
            return;
        }
        // En yeni yorumlar üste gelecek şekilde sırala (isteğe bağlı)
        const sortedComments = [...comments].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedComments.forEach(comment => {
            const row = commentListTableBody.insertRow();
            const postTitle = posts.find(p => p.id === comment.postId)?.title || 'Bilinmeyen Yazı';
            row.innerHTML = `
                <td>${comment.id}</td>
                <td>${comment.postId} (${postTitle})</td>
                <td>${comment.author}</td>
                <td>${comment.text.substring(0, 50)}${comment.text.length > 50 ? '...' : ''}</td>
                <td>${formatDate(comment.date)}</td>
                <td>
                    <select class="comment-status-select" data-id="${comment.id}">
                        <option value="pending" ${comment.status === 'pending' ? 'selected' : ''}>Beklemede</option>
                        <option value="approved" ${comment.status === 'approved' ? 'selected' : ''}>Onaylandı</option>
                        <option value="rejected" ${comment.status === 'rejected' ? 'selected' : ''}>Reddedildi</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-sm btn-delete-comment" data-id="${comment.id}"><i class="fas fa-trash"></i> Sil</button>
                </td>
            `;
        });
        addCommentListActionListeners();
        updateDashboardStats();
    }

    function addCommentListActionListeners() {
        document.querySelectorAll('.comment-status-select').forEach(select => {
            select.addEventListener('change', (e) => {
                updateCommentStatus(e.currentTarget.dataset.id, e.currentTarget.value);
            });
        });
        document.querySelectorAll('.btn-delete-comment').forEach(button => {
            button.addEventListener('click', (e) => {
                deleteComment(e.currentTarget.dataset.id);
            });
        });
    }

    function updateCommentStatus(commentId, newStatus) {
        const index = comments.findIndex(c => c.id == commentId);
        if (index !== -1) {
            comments[index].status = newStatus;
            saveCommentsToLocalStorage();
            renderCommentList(); // Listeyi yeniden oluşturup istatistikleri günceller
        }
    }

    function deleteComment(commentId) {
        if (confirm(`Yorumu silmek istediğinizden emin misiniz?`)) {
            comments = comments.filter(c => c.id != commentId);
            saveCommentsToLocalStorage();
            renderCommentList();
        }
    }

    // --- AYARLAR ---
    function loadSettingsFromLocalStorage() {
        const storedSettings = localStorage.getItem(SETTINGS_KEY);
        if (storedSettings) {
            settings = JSON.parse(storedSettings);
        } else {
            settings = { siteTitle: "Benim Harika Sitem", postsPerPage: 5, adminTheme: "dark" };
            saveSettingsToLocalStorage();
        }
    }

    function saveSettingsToLocalStorage() {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    function renderSettingsForm() {
        if (!settingsForm) return;
        document.getElementById('setting-site-title').value = settings.siteTitle || '';
        document.getElementById('setting-posts-per-page').value = settings.postsPerPage || 5;
        document.getElementById('setting-admin-theme').value = settings.adminTheme || 'dark';
        // Tema değişikliğini uygula (CSS değişkenleri veya class ile)
        // document.body.setAttribute('data-theme', settings.adminTheme || 'dark');
    }

    function handleSettingsFormSubmit(event) {
        event.preventDefault();
        if (!settingsForm) return;
        settings.siteTitle = document.getElementById('setting-site-title').value;
        settings.postsPerPage = parseInt(document.getElementById('setting-posts-per-page').value) || 5;
        settings.adminTheme = document.getElementById('setting-admin-theme').value;
        saveSettingsToLocalStorage();
        renderSettingsForm(); // Formu güncel değerlerle yeniden doldur
        alert('Ayarlar kaydedildi!');
        // Tema değişikliğini burada da uygula
        // document.body.setAttribute('data-theme', settings.adminTheme);
    }

    // --- BAŞLANGIÇ İŞLEMLERİ ---
    function initializeAdminPanel() {
        updateYear();

        // Sidebar navigasyonu
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.dataset.target;
                switchContent(targetId);
                // URL hash'ini de güncelleyelim ki sayfa yenilendiğinde doğru yerde açılsın
                // window.location.hash = targetId.replace('-content', ''); // Dikkat: Bu satır bazen sorunlara yol açabilir.
            });
        });
        
        handleInitialLoadNavigation(); // Sayfa ilk yüklendiğinde hash'e göre doğru bölümü göster

        // Çıkış butonu
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                alert('Çıkış yapıldı (simülasyon). Gerçek bir uygulamada burada oturum sonlandırılacaktır.');
                // Örnek: window.location.href = 'login.html';
            });
        }

        // Verileri yükle
        loadPostsFromLocalStorage();
        loadPagesFromLocalStorage();
        loadCommentsFromLocalStorage(); // loadPosts'tan sonra çağır ki postId'leri alabilsin
        loadSettingsFromLocalStorage();

        // Arayüzü oluştur/güncelle
        renderPostList();
        renderPageList();
        renderCommentList();
        renderSettingsForm();
        updateDashboardStats(); // Tüm yüklemelerden sonra istatistikleri güncelle

        // Yazı Yönetimi Modal ve Form Olayları
        if (addPostButton) addPostButton.addEventListener('click', () => openPostModal());
        if (closePostModalButton) closePostModalButton.addEventListener('click', () => { if (postFormModal) postFormModal.style.display = 'none'; });
        if (cancelPostButton) cancelPostButton.addEventListener('click', () => { if (postFormModal) postFormModal.style.display = 'none'; });
        if (postForm) postForm.addEventListener('submit', handlePostFormSubmit);

        // Sayfa Yönetimi Modal ve Form Olayları
        if (addPageButton) addPageButton.addEventListener('click', () => openPageModal());
        if (closePageModalButton) closePageModalButton.addEventListener('click', () => { if (pageFormModal) pageFormModal.style.display = 'none'; });
        if (cancelPageButton) cancelPageButton.addEventListener('click', () => { if (pageFormModal) pageFormModal.style.display = 'none'; });
        if (pageForm) pageForm.addEventListener('submit', handlePageFormSubmit);

        // Ayarlar Form Olayı
        if (settingsForm) settingsForm.addEventListener('submit', handleSettingsFormSubmit);

        // Modal dışına tıklayınca kapatma (isteğe bağlı)
        window.onclick = function(event) {
            if (event.target == postFormModal) {
                postFormModal.style.display = "none";
            }
            if (event.target == pageFormModal) {
                pageFormModal.style.display = "none";
            }
        }
    }

    initializeAdminPanel();
}); 