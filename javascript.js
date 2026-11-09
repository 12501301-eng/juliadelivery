"use strict";

/* =====================================================
   FOODEXPRESS — JAVASCRIPT PRINCIPAL
   Funcionalidades:
   - Menu responsivo
   - Pesquisa e filtros de produtos
   - Ordenação do cardápio
   - Carrinho de compras
   - Favoritos
   - Máscaras de formulário
   - Validação de cadastro
   - Endereço de entrega
   - Cupons de desconto
   - Login e cadastro demonstrativos
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTOS GERAIS
       ===================================================== */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    const formatCurrency = (value) =>
        Number(value).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

    const onlyNumbers = (value) =>
        value.replace(/\D/g, "");

    const normalizeText = (value) =>
        value
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

    function showMessage(element, message, type = "success") {
        if (!element) return;

        element.textContent = message;
        element.className = `form-message ${type}`;
    }

    function showToast(message, type = "success") {
        const container = $("#toast-container");

        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.setAttribute("role", "status");

        const icon = document.createElement("i");
        icon.className = type === "error"
            ? "fa-solid fa-circle-exclamation"
            : "fa-solid fa-circle-check";

        const text = document.createElement("span");
        text.textContent = message;

        toast.append(icon, text);
        container.appendChild(toast);

        window.setTimeout(() => {
            toast.classList.add("toast-hiding");

            window.setTimeout(() => toast.remove(), 300);
        }, 3000);
    }


    /* =====================================================
       MENU RESPONSIVO
       ===================================================== */

    const menuToggle = $("#menu-toggle");
    const navigation = $("#navigation");

    if (menuToggle && navigation) {
        menuToggle.addEventListener("click", () => {
            const isOpen = navigation.classList.toggle("menu-open");

            menuToggle.setAttribute("aria-expanded", String(isOpen));

            const icon = $("i", menuToggle);

            if (icon) {
                icon.className = isOpen
                    ? "fa-solid fa-xmark"
                    : "fa-solid fa-bars";
            }
        });

        $$(".nav-link", navigation).forEach((link) => {
            link.addEventListener("click", () => {
                navigation.classList.remove("menu-open");
                menuToggle.setAttribute("aria-expanded", "false");

                const icon = $("i", menuToggle);

                if (icon) {
                    icon.className = "fa-solid fa-bars";
                }
            });
        });
    }


    /* =====================================================
       PESQUISA
       ===================================================== */

    const searchToggle = $("#search-toggle");
    const searchBar = $("#search-bar");
    const searchInput = $("#search-input");
    const clearSearch = $("#clear-search");

    if (searchToggle && searchBar) {
        searchToggle.addEventListener("click", () => {
            const opening = searchBar.hidden;

            searchBar.hidden = !opening;

            if (opening && searchInput) {
                searchInput.focus();
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            applyProductFilters();
        });

        searchInput.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                searchInput.value = "";
                applyProductFilters();

                if (searchBar) {
                    searchBar.hidden = true;
                }
            }
        });
    }

    if (clearSearch) {
        clearSearch.addEventListener("click", () => {
            if (searchInput) {
                searchInput.value = "";
                applyProductFilters();
                searchInput.focus();
            }
        });
    }


    /* =====================================================
       PRODUTOS E FILTROS
       ===================================================== */

    const productsGrid = $("#products-grid");
    const emptyProducts = $("#empty-products");
    const filterButtons = $$(".filter-button");
    const categoryButtons = $$(".category-card");
    const sortSelect = $("#sort-products");

    let selectedCategory = "todos";

    const productCards = productsGrid
        ? $$(".product-card", productsGrid)
        : [];

    function getProductData(card) {
        return {
            id: card.dataset.id,
            name: card.dataset.name || "",
            category: card.dataset.category || "",
            price: Number(card.dataset.price) || 0,
            rating: Number(card.dataset.rating) || 0
        };
    }

    function applyProductFilters() {
        const query = normalizeText(searchInput?.value || "");
        let visibleCount = 0;

        productCards.forEach((card) => {
            const product = getProductData(card);

            const matchesCategory =
                selectedCategory === "todos" ||
                product.category === selectedCategory;

            const matchesSearch =
                normalizeText(product.name).includes(query) ||
                normalizeText(card.textContent).includes(query);

            const visible = matchesCategory && matchesSearch;

            card.hidden = !visible;

            if (visible) visibleCount++;
        });

        if (emptyProducts) {
            emptyProducts.hidden = visibleCount !== 0;
        }

        if (productsGrid) {
            const loadMore = $("#load-more");

            if (loadMore) {
                loadMore.hidden = true;
            }
        }
    }

    function setCategory(category) {
        selectedCategory = category || "todos";

        filterButtons.forEach((button) => {
            const active = button.dataset.filter === selectedCategory;

            button.classList.toggle("active", active);
        });

        categoryButtons.forEach((button) => {
            const active = button.dataset.category === selectedCategory;

            button.classList.toggle("active", active);
        });

        applyProductFilters();
    }

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            setCategory(button.dataset.filter);
        });
    });

    categoryButtons.forEach((button) => {
        button.addEventListener("click", () => {
            setCategory(button.dataset.category);
            $("#cardapio")?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });

    function sortProducts() {
        if (!productsGrid || !sortSelect) return;

        const mode = sortSelect.value;

        const sorted = [...productCards];

        sorted.sort((a, b) => {
            const productA = getProductData(a);
            const productB = getProductData(b);

            switch (mode) {
                case "menor-preco":
                    return productA.price - productB.price;

                case "maior-preco":
                    return productB.price - productA.price;

                case "avaliacao":
                    return productB.rating - productA.rating;

                case "popular":
                default:
                    return Number(productA.id) - Number(productB.id);
            }
        });

        sorted.forEach((card) => productsGrid.appendChild(card));
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", sortProducts);
    }


    /* =====================================================
       FAVORITOS
       ===================================================== */

    $$(".favorite-button").forEach((button) => {
        button.addEventListener("click", () => {
            const isFavorite = button.classList.toggle("is-favorite");
            const icon = $("i", button);

            if (icon) {
                icon.className = isFavorite
                    ? "fa-solid fa-heart"
                    : "fa-regular fa-heart";
            }

            button.setAttribute(
                "aria-pressed",
                String(isFavorite)
            );

            const card = button.closest(".product-card");
            const productName = card?.dataset.name || "Produto";

            showToast(
                isFavorite
                    ? `${productName} adicionado aos favoritos.`
                    : `${productName} removido dos favoritos.`
            );
        });
    });


    /* =====================================================
       CARRINHO
       ===================================================== */

    const cartPanel = $("#cart-panel");
    const cartOverlay = $("#cart-overlay");
    const openCartButton = $("#open-cart");
    const closeCartButton = $("#close-cart");
    const continueShoppingButton = $("#continue-shopping");

    const cartItemsContainer = $("#cart-items");
    const cartCount = $("#cart-count");
    const cartItemsLabel = $("#cart-items-label");

    const cartSubtotal = $("#cart-subtotal");
    const deliveryFeeElement = $("#delivery-fee");
    const cartDiscount = $("#cart-discount");
    const discountLine = $("#discount-line");
    const cartTotal = $("#cart-total");
    const checkoutButton = $("#checkout-button");

    const DELIVERY_FEE = 5;

    // Cupons demonstrativos; não representam uma promoção real.
    const COUPONS = {
        BEMVINDO10: {
            type: "percentage",
            value: 10,
            minimum: 30
        },
        ENTREGA: {
            type: "delivery",
            value: 0,
            minimum: 0
        }
    };

    let cart = [];
    let appliedCoupon = null;

    function getCartQuantity() {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    function getSubtotal() {
        return cart.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
    }

    function getDiscount(subtotal) {
        if (!appliedCoupon) return 0;

        if (subtotal < appliedCoupon.minimum) {
            return 0;
        }

        if (appliedCoupon.type === "percentage") {
            return subtotal * appliedCoupon.value / 100;
        }

        return 0;
    }

    function getDeliveryFee() {
        if (appliedCoupon?.type === "delivery") {
            return 0;
        }

        return DELIVERY_FEE;
    }

    function renderCart() {
        const quantity = getCartQuantity();
        const subtotal = getSubtotal();
        const discount = getDiscount(subtotal);
        const delivery = getDeliveryFee();
        const total = Math.max(0, subtotal - discount + delivery);

        if (cartCount) {
            cartCount.textContent = quantity;
        }

        if (cartItemsLabel) {
            cartItemsLabel.textContent =
                `${quantity} ${quantity === 1 ? "item selecionado" : "itens selecionados"}`;
        }

        if (cartSubtotal) {
            cartSubtotal.textContent = formatCurrency(subtotal);
        }

        if (deliveryFeeElement) {
            deliveryFeeElement.textContent = formatCurrency(delivery);
        }

        if (cartDiscount) {
            cartDiscount.textContent = `− ${formatCurrency(discount)}`;
        }

        if (discountLine) {
            discountLine.hidden = discount <= 0;
        }

        if (cartTotal) {
            cartTotal.textContent = formatCurrency(total);
        }

        if (checkoutButton) {
            checkoutButton.disabled = quantity === 0;
        }

        if (!cartItemsContainer) return;

        cartItemsContainer.replaceChildren();

        if (cart.length === 0) {
            const empty = document.createElement("div");
            empty.className = "cart-empty";

            const icon = document.createElement("i");
            icon.className = "fa-solid fa-basket-shopping";

            const title = document.createElement("h3");
            title.textContent = "Seu carrinho está vazio";

            const message = document.createElement("p");
            message.textContent =
                "Adicione seus pratos favoritos para começar.";

            const button = document.createElement("button");
            button.type = "button";
            button.className = "primary-button";
            button.textContent = "Explorar cardápio";
            button.id = "continue-shopping";

            button.addEventListener("click", () => {
                closeCart();
                $("#cardapio")?.scrollIntoView({ behavior: "smooth" });
            });

            empty.append(icon, title, message, button);
            cartItemsContainer.appendChild(empty);

            return;
        }

        cart.forEach((item) => {
            const row = document.createElement("article");
            row.className = "cart-item";

            const image = document.createElement("img");
            image.src = item.image;
            image.alt = item.name;
            image.loading = "lazy";

            const info = document.createElement("div");
            info.className = "cart-item-info";

            const title = document.createElement("h3");
            title.textContent = item.name;

            const price = document.createElement("p");
            price.textContent = formatCurrency(item.price);

            const controls = document.createElement("div");
            controls.className = "quantity-controls";

            const decrease = document.createElement("button");
            decrease.type = "button";
            decrease.textContent = "−";
            decrease.setAttribute(
                "aria-label",
                `Diminuir quantidade de ${item.name}`
            );

            decrease.addEventListener("click", () => {
                changeQuantity(item.id, -1);
            });

            const quantity = document.createElement("span");
            quantity.textContent = item.quantity;

            const increase = document.createElement("button");
            increase.type = "button";
            increase.textContent = "+";
            increase.setAttribute(
                "aria-label",
                `Aumentar quantidade de ${item.name}`
            );

            increase.addEventListener("click", () => {
                changeQuantity(item.id, 1);
            });

            controls.append(decrease, quantity, increase);

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "remove-cart-item";
            remove.setAttribute("aria-label", `Remover ${item.name}`);
            remove.innerHTML = '<i class="fa-solid fa-trash"></i>';

            remove.addEventListener("click", () => {
                removeFromCart(item.id);
            });

            info.append(title, price, controls);
            row.append(image, info, remove);

            cartItemsContainer.appendChild(row);
        });
    }

    function addToCart(card) {
        const product = getProductData(card);

        const image = $("img", $(".product-image", card));

        if (!product.id || !product.name || product.price <= 0) {
            showToast("Não foi possível adicionar esse produto.", "error");
            return;
        }

        const existing = cart.find((item) => item.id === product.id);

        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                ...product,
                quantity: 1,
                image: image?.src || ""
            });
        }

        renderCart();
        showToast(`${product.name} adicionado ao carrinho.`);
    }

    function changeQuantity(id, amount) {
        const item = cart.find((product) => product.id === id);

        if (!item) return;

        item.quantity += amount;

        if (item.quantity <= 0) {
            cart = cart.filter((product) => product.id !== id);
        }

        renderCart();
    }

    function removeFromCart(id) {
        const item = cart.find((product) => product.id === id);

        cart = cart.filter((product) => product.id !== id);

        renderCart();

        if (item) {
            showToast(`${item.name} removido do carrinho.`);
        }
    }

    function openCart() {
        if (!cartPanel) return;

        cartPanel.classList.add("cart-open");
        cartPanel.setAttribute("aria-hidden", "false");
        cartPanel.inert = false;

        if (cartOverlay) {
            cartOverlay.hidden = false;
            cartOverlay.classList.add("overlay-visible");
        }

        document.body.classList.add("no-scroll");
        closeCartButton?.focus();
    }

    function closeCart() {
        if (!cartPanel) return;

        cartPanel.classList.remove("cart-open");
        cartPanel.setAttribute("aria-hidden", "true");
        cartPanel.inert = true;

        if (cartOverlay) {
            cartOverlay.classList.remove("overlay-visible");
            cartOverlay.hidden = true;
        }

        document.body.classList.remove("no-scroll");
        openCartButton?.focus();
    }

    if (openCartButton) {
        openCartButton.addEventListener("click", openCart);
    }

    if (closeCartButton) {
        closeCartButton.addEventListener("click", closeCart);
    }

    if (cartOverlay) {
        cartOverlay.addEventListener("click", closeCart);
    }

    if (continueShoppingButton) {
        continueShoppingButton.addEventListener("click", () => {
            closeCart();
            $("#cardapio")?.scrollIntoView({ behavior: "smooth" });
        });
    }

    $$(".add-to-cart").forEach((button) => {
        button.addEventListener("click", () => {
            const card = button.closest(".product-card");

            if (card) addToCart(card);
        });
    });

    renderCart();


    /* =====================================================
       CUPONS
       ===================================================== */

    const couponInput = $("#coupon-code");
    const applyCouponButton = $("#apply-coupon");

    if (applyCouponButton && couponInput) {
        applyCouponButton.addEventListener("click", () => {
            const code = couponInput.value.trim().toUpperCase();

            if (!code) {
                showToast("Digite um cupom antes de aplicar.", "error");
                couponInput.focus();
                return;
            }

            const coupon = COUPONS[code];

            if (!coupon) {
                showToast("Cupom inválido.", "error");
                appliedCoupon = null;
                renderCart();
                return;
            }

            if (getSubtotal() < coupon.minimum) {
                showToast(
                    `O pedido mínimo para esse cupom é ${formatCurrency(coupon.minimum)}.`,
                    "error"
                );
                return;
            }

            appliedCoupon = coupon;
            renderCart();

            showToast(
                coupon.type === "delivery"
                    ? "Cupom aplicado: entrega grátis!"
                    : "Cupom aplicado: 10% de desconto!"
            );
        });
    }


    /* =====================================================
       MODAIS
       ===================================================== */

    const authOverlay = $("#auth-overlay");
    const openLoginButton = $("#open-login");
    const closeAuthButton = $("#close-auth");

    const loginForm = $("#login-form");
    const registerForm = $("#register-form");

    const authTitle = $("#auth-title");
    const authDescription = $("#auth-description");

    const authTabs = $$(".auth-tab");

    function openAuth(mode = "login") {
        if (!authOverlay) return;

        authOverlay.hidden = false;
        setAuthMode(mode);

        document.body.classList.add("no-scroll");

        const firstInput = mode === "register"
            ? $("#register-name")
            : $("#login-email");

        firstInput?.focus();
    }

    function closeAuth() {
        if (!authOverlay) return;

        authOverlay.hidden = true;
        document.body.classList.remove("no-scroll");
        openLoginButton?.focus();
    }

    function setAuthMode(mode) {
        const isRegister = mode === "register";

        if (loginForm) loginForm.hidden = isRegister;
        if (registerForm) registerForm.hidden = !isRegister;

        authTabs.forEach((tab) => {
            const active = tab.dataset.authTab === mode;

            tab.classList.toggle("active", active);
            tab.setAttribute("aria-selected", String(active));
        });

        if (authTitle) {
            authTitle.textContent = isRegister
                ? "Crie sua conta"
                : "Bem-vindo!";
        }

        if (authDescription) {
            authDescription.textContent = isRegister
                ? "Preencha seus dados para fazer seu cadastro."
                : "Entre na sua conta para continuar.";
        }
    }

    openLoginButton?.addEventListener("click", () => openAuth("login"));

    closeAuthButton?.addEventListener("click", closeAuth);

    authTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            setAuthMode(tab.dataset.authTab);
        });
    });

    if (authOverlay) {
        authOverlay.addEventListener("click", (event) => {
            if (event.target === authOverlay) {
                closeAuth();
            }
        });
    }


    /* =====================================================
       MÁSCARAS DOS CAMPOS
       ===================================================== */

    function maskPhone(value) {
        const digits = onlyNumbers(value).slice(0, 11);

        if (digits.length <= 2) {
            return digits.length ? `(${digits}` : "";
        }

        if (digits.length <= 6) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        }

        if (digits.length <= 10) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
        }

        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }

    function maskCPF(value) {
        const digits = onlyNumbers(value).slice(0, 11);

        return digits
            .replace(/^(\d{3})(\d)/, "$1.$2")
            .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/\.(\d{3})(\d)/, ".$1-$2");
    }

    function maskCEP(value) {
        const digits = onlyNumbers(value).slice(0, 8);

        if (digits.length > 5) {
            return `${digits.slice(0, 5)}-${digits.slice(5)}`;
        }

        return digits;
    }

    function maskDate(value) {
        const digits = onlyNumbers(value).slice(0, 8);

        if (digits.length <= 2) return digits;

        if (digits.length <= 4) {
            return `${digits.slice(0, 2)}/${digits.slice(2)}`;
        }

        return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }

    function applyMask(input, maskFunction) {
        if (!input) return;

        input.addEventListener("input", () => {
            const oldValue = input.value;
            const start = input.selectionStart ?? oldValue.length;

            const digitsBeforeCursor = onlyNumbers(
                oldValue.slice(0, start)
            ).length;

            const newValue = maskFunction(oldValue);

            input.value = newValue;

            // Mantém o cursor próximo da posição original.
            if (document.activeElement === input) {
                let position = 0;
                let digitsCount = 0;

                while (
                    position < newValue.length &&
                    digitsCount < digitsBeforeCursor
                ) {
                    if (/\d/.test(newValue[position])) {
                        digitsCount++;
                    }

                    position++;
                }

                input.setSelectionRange(position, position);
            }
        });
    }

    applyMask($("#register-phone"), maskPhone);
    applyMask($("#register-cpf"), maskCPF);
    applyMask($("#register-birth"), maskDate);
    applyMask($("#register-cep"), maskCEP);
    applyMask($("#address-cep"), maskCEP);


    /* =====================================================
       CAMPOS QUE ACEITAM APENAS NÚMEROS
       ===================================================== */

    function restrictToNumbers(input, maxDigits = Infinity) {
        if (!input) return;

        input.addEventListener("input", () => {
            const start = input.selectionStart ?? input.value.length;
            const oldBeforeCursor = input.value.slice(0, start);

            const digitsBeforeCursor = onlyNumbers(oldBeforeCursor).length;

            input.value = onlyNumbers(input.value).slice(0, maxDigits);

            if (document.activeElement === input) {
                let position = 0;
                let count = 0;

                while (
                    position < input.value.length &&
                    count < digitsBeforeCursor
                ) {
                    count++;
                    position++;
                }

                input.setSelectionRange(position, position);
            }
        });
    }

    // Campos de número sem formatação.
    restrictToNumbers($("#address-number"), 10);

    // CPF e CEP usam máscaras, mas aceitam apenas dígitos na entrada.
    // A máscara adiciona automaticamente os sinais de pontuação.


    /* =====================================================
       VALIDAÇÃO DE CPF
       ===================================================== */

    function isValidCPF(value) {
        const cpf = onlyNumbers(value);

        if (cpf.length !== 11) return false;

        if (/^(\d)\1{10}$/.test(cpf)) return false;

        let sum = 0;

        for (let i = 0; i < 9; i++) {
            sum += Number(cpf[i]) * (10 - i);
        }

        let digit = (sum * 10) % 11;

        if (digit === 10) digit = 0;

        if (digit !== Number(cpf[9])) return false;

        sum = 0;

        for (let i = 0; i < 10; i++) {
            sum += Number(cpf[i]) * (11 - i);
        }

        digit = (sum * 10) % 11;

        if (digit === 10) digit = 0;

        return digit === Number(cpf[10]);
    }

    function isValidDate(value) {
        const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

        if (!match) return false;

        const day = Number(match[1]);
        const month = Number(match[2]);
        const year = Number(match[3]);

        const date = new Date(year, month - 1, day);

        const valid =
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day;

        if (!valid) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return date <= today;
    }


    /* =====================================================
       CADASTRO
       ===================================================== */

    if (registerForm) {
        registerForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const name = $("#register-name");
            const email = $("#register-email");
            const phone = $("#register-phone");
            const cpf = $("#register-cpf");
            const birth = $("#register-birth");
            const cep = $("#register-cep");
            const password = $("#register-password");
            const confirmPassword = $("#register-confirm-password");
            const terms = $("#accept-terms");
            const message = $("#register-message");

            if (!registerForm.checkValidity()) {
                registerForm.reportValidity();
                return;
            }

            if (!name.value.trim() || name.value.trim().length < 3) {
                showMessage(
                    message,
                    "Digite seu nome completo.",
                    "error"
                );
                name.focus();
                return;
            }

            if (onlyNumbers(phone.value).length < 10) {
                showMessage(
                    message,
                    "Digite um telefone válido com DDD.",
                    "error"
                );
                phone.focus();
                return;
            }

            if (!isValidCPF(cpf.value)) {
                showMessage(
                    message,
                    "O CPF informado não é válido.",
                    "error"
                );
                cpf.focus();
                return;
            }

            if (!isValidDate(birth.value)) {
                showMessage(
                    message,
                    "Digite uma data de nascimento válida.",
                    "error"
                );
                birth.focus();
                return;
            }

            if (onlyNumbers(cep.value).length !== 8) {
                showMessage(
                    message,
                    "Digite um CEP válido com 8 números.",
                    "error"
                );
                cep.focus();
                return;
            }

            if (password.value.length < 8) {
                showMessage(
                    message,
                    "A senha precisa ter pelo menos 8 caracteres.",
                    "error"
                );
                password.focus();
                return;
            }

            if (password.value !== confirmPassword.value) {
                showMessage(
                    message,
                    "As senhas não coincidem.",
                    "error"
                );
                confirmPassword.focus();
                return;
            }

            if (!terms.checked) {
                showMessage(
                    message,
                    "Você precisa aceitar os termos para continuar.",
                    "error"
                );
                terms.focus();
                return;
            }

            /*
             * Este projeto é apenas front-end.
             * Não enviamos nem salvamos senhas ou CPFs.
             * Um cadastro real precisa de um backend seguro.
             */

            showMessage(
                message,
                "Validação concluída! Para criar uma conta real, é necessário conectar um servidor.",
                "success"
            );

            showToast("Dados validados com sucesso!");
        });
    }


    /* =====================================================
       LOGIN DEMONSTRATIVO
       ===================================================== */

    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const message = $("#login-message");

            if (!loginForm.checkValidity()) {
                loginForm.reportValidity();
                return;
            }

            showMessage(
                message,
                "Formulário válido. O login real precisa de um servidor.",
                "success"
            );
        });
    }


    /* =====================================================
       RECUPERAÇÃO DE SENHA
       ===================================================== */

    const forgotPasswordButton = $("#forgot-password");

    if (forgotPasswordButton) {
        forgotPasswordButton.addEventListener("click", () => {
            const email = $("#login-email");

            if (!email || !email.value.trim()) {
                showToast(
                    "Digite seu e-mail para continuar.",
                    "error"
                );
                email?.focus();
                return;
            }

            if (!email.checkValidity()) {
                email.reportValidity();
                return;
            }

            showToast(
                "A recuperação de senha precisa de um servidor conectado.",
                "error"
            );
        });
    }


    /* =====================================================
       ENDEREÇO DE ENTREGA
       ===================================================== */

    const addressOverlay = $("#address-overlay");
    const openAddressButton = $("#open-address");
    const closeAddressButton = $("#close-address");
    const addressForm = $("#address-form");
    const deliveryAddress = $("#delivery-address");

    function openAddress() {
        if (!addressOverlay) return;

        addressOverlay.hidden = false;
        document.body.classList.add("no-scroll");
        $("#address-cep")?.focus();
    }

    function closeAddress() {
        if (!addressOverlay) return;

        addressOverlay.hidden = true;
        document.body.classList.remove("no-scroll");
        openAddressButton?.focus();
    }

    openAddressButton?.addEventListener("click", openAddress);
    closeAddressButton?.addEventListener("click", closeAddress);

    if (addressOverlay) {
        addressOverlay.addEventListener("click", (event) => {
            if (event.target === addressOverlay) {
                closeAddress();
            }
        });
    }

    if (addressForm) {
        addressForm.addEventListener("submit", (event) => {
            event.preventDefault();

            if (!addressForm.checkValidity()) {
                addressForm.reportValidity();
                return;
            }

            const cep = $("#address-cep");
            const street = $("#address-street");
            const number = $("#address-number");
            const complement = $("#address-complement");
            const neighborhood = $("#address-neighborhood");
            const city = $("#address-city");
            const state = $("#address-state");
            const message = $("#address-message");

            if (onlyNumbers(cep.value).length !== 8) {
                showMessage(
                    message,
                    "O CEP deve conter 8 números.",
                    "error"
                );
                cep.focus();
                return;
            }

            const stateValue = state.value.trim().toUpperCase();

            if (!/^[A-Z]{2}$/.test(stateValue)) {
                showMessage(
                    message,
                    "Digite uma UF válida com duas letras.",
                    "error"
                );
                state.focus();
                return;
            }

            const completeAddress = [
                `${street.value.trim()}, ${number.value.trim()}`,
                complement.value.trim(),
                neighborhood.value.trim(),
                `${city.value.trim()} - ${stateValue}`,
                cep.value.trim()
            ].filter(Boolean).join(", ");

            if (deliveryAddress) {
                deliveryAddress.textContent = completeAddress;
            }

            showMessage(
                message,
                "Endereço atualizado nesta página.",
                "success"
            );

            showToast("Endereço atualizado!");

            window.setTimeout(closeAddress, 800);
        });
    }


    /* =====================================================
       FINALIZAÇÃO DO PEDIDO
       ===================================================== */

    if (checkoutButton) {
        checkoutButton.addEventListener("click", () => {
            if (cart.length === 0) {
                showToast("Adicione produtos antes de continuar.", "error");
                return;
            }

            const addressText =
                deliveryAddress?.textContent.trim() || "";

            if (
                !addressText ||
                addressText === "Informe seu endereço"
            ) {
                closeCart();
                openAddress();

                showToast(
                    "Informe o endereço de entrega primeiro.",
                    "error"
                );

                return;
            }

            /*
             * A página ainda não possui integração com pagamento,
             * banco de dados ou sistema de pedidos.
             */

            showToast(
                "Carrinho pronto! A finalização real exige integração com um servidor."
            );
        });
    }


    /* =====================================================
       OFERTA ESPECIAL
       ===================================================== */

    const claimOfferButton = $("#claim-offer");

    if (claimOfferButton) {
        claimOfferButton.addEventListener("click", () => {
            openAuth("register");
        });
    }


    /* =====================================================
       NEWSLETTER
       ===================================================== */

    const newsletterForm = $("#newsletter-form");

    if (newsletterForm) {
        newsletterForm.addEventListener("submit", (event) => {
            event.preventDefault();

            if (!newsletterForm.checkValidity()) {
                newsletterForm.reportValidity();
                return;
            }

            const email = $("#newsletter-email");

            showToast(
                "E-mail validado! A inscrição real precisa de integração."
            );

            newsletterForm.reset();
        });
    }


    /* =====================================================
       TECLA ESCAPE
       ===================================================== */

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;

        if (authOverlay && !authOverlay.hidden) {
            closeAuth();
        }

        if (addressOverlay && !addressOverlay.hidden) {
            closeAddress();
        }

        if (cartPanel?.classList.contains("cart-open")) {
            closeCart();
        }

        if (searchBar && !searchBar.hidden) {
            searchBar.hidden = true;
        }
    });


    /* =====================================================
       ANO AUTOMÁTICO NO RODAPÉ
       ===================================================== */

    const currentYear = $("#current-year");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


    /* =====================================================
       INICIALIZAÇÃO
       ===================================================== */

    applyProductFilters();

    console.info("FoodExpress: JavaScript inicializado.");
});


const themeToggle = document.getElementById("theme-toggle");

// Recupera o tema salvo
const savedTheme = localStorage.getItem("delivery-theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀️";
    themeToggle.setAttribute("aria-label", "Ativar modo claro");
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    const isDarkMode = document.body.classList.contains("dark-mode");

    themeToggle.textContent = isDarkMode ? "☀️" : "🌙";
    themeToggle.setAttribute(
        "aria-label",
        isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"
    );

    localStorage.setItem(
        "delivery-theme",
        isDarkMode ? "dark" : "light"
    );
});
