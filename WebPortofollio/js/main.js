// Small shared behaviours: nav toggle, smooth scroll, CTA pulse, order price update, simple form handling
(function(){
  // nav toggle for small screens (single handler: toggles class, aria, and icon)
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  if(navToggle && nav){
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.addEventListener('click', function(){
      var open = nav.classList.toggle('open');
      navToggle.classList.toggle('open', open);
      // accessibility: reflect state
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Page transition: apply enter class on load
  document.documentElement.classList.remove('no-js');
  document.addEventListener('DOMContentLoaded', function(){
    // check stored entry direction from previous navigation
    try{
      var enterFrom = sessionStorage.getItem('navEnterFrom');
      if(enterFrom === 'left' || enterFrom === 'right'){
        document.body.classList.add('enter-from-' + enterFrom);
        sessionStorage.removeItem('navEnterFrom');
      }
    }catch(e){}
    // ensure small delay so CSS can apply then reveal
    setTimeout(function(){ document.body.classList.add('is-loaded'); }, 25);
  });

  // Intercept internal link clicks to animate exit before navigation
  document.addEventListener('click', function(e){
    var a = e.target.closest('a');
    if(!a) return;
    var href = a.getAttribute('href');
    // ignore external links, anchors, mailto, tel, javascript:, or links with target=_blank
    if(!href || href.indexOf('mailto:')===0 || href.indexOf('tel:')===0) return;
    if(href.charAt(0) === '#') return; // handled by smooth scroll
    if(a.target && a.target.toLowerCase() === '_blank') return;
    // same origin check
    var linkUrl;
    try{ linkUrl = new URL(href, location.href); }catch(err){ return; }
    if(linkUrl.origin !== location.origin) return;

    // allow data-no-transition to skip
    if(a.hasAttribute('data-no-transition')) return;

    // store the clicked nav href so next page can animate indicator from previous
    try{
      if(a.closest && a.closest('.nav')){
        sessionStorage.setItem('navClicked', a.getAttribute('href'));
        // calculate direction based on nav index
        var navEl = a.closest('.nav');
        var links = Array.from(navEl.querySelectorAll('a'));
        var active = links.find(function(l){ return l.classList.contains('active') || (new URL(l.href, location.href).pathname === location.pathname); }) || links[0];
        var activeIndex = Math.max(0, links.indexOf(active));
        var clickedIndex = Math.max(0, links.indexOf(a));
        var enterFrom = 'right';
        if(clickedIndex > activeIndex) enterFrom = 'right';
        else if(clickedIndex < activeIndex) enterFrom = 'left';
        else enterFrom = 'right';
        sessionStorage.setItem('navEnterFrom', enterFrom);
        // set exit class on current body (opposite movement)
        if(enterFrom === 'right'){
          document.body.classList.add('exit-to-left');
        } else {
          document.body.classList.add('exit-to-right');
        }
      }
    }catch(_){ }

    // proceed with animated navigation: show overlay + exit animation
    e.preventDefault();
    var dest = linkUrl.href;

    // ensure overlay exists
    var overlay = document.getElementById('pageOverlay');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.id = 'pageOverlay';
      overlay.className = 'page-overlay';
      var fill = document.createElement('div'); fill.className = 'fill'; overlay.appendChild(fill);
      document.body.appendChild(overlay);
    }
    // trigger overlay animation (set origin based on stored nav direction)
    try{ var ef = sessionStorage.getItem('navEnterFrom'); if(ef === 'left' || ef === 'right'){ overlay.style.transformOrigin = (ef === 'right' ? 'left center' : 'right center'); } }catch(e){}
    // force reflow then activate
    void overlay.offsetWidth;
    overlay.classList.add('active');

    var finished = false;
    var go = function(){ if(finished) return; finished = true; location.href = dest; };
    // wait for overlay transition end
    overlay.addEventListener('transitionend', function onOe(ev){ if(ev.target === overlay){ overlay.removeEventListener('transitionend', onOe); go(); } });
    // fallback
    setTimeout(go, 700);
  }, true);

  // NAV INDICATOR: create and position an indicator that moves to the active link
  function initNavIndicator(){
    var navEls = Array.from(document.querySelectorAll('.nav, .mobile-bottom-nav'));
    if(!navEls.length) return;

    navEls.forEach(function(navEl){
      var indicator = navEl.querySelector('.nav-indicator');
      if(!indicator){ indicator = document.createElement('span'); indicator.className = 'nav-indicator'; navEl.appendChild(indicator); }

      function update(){
        var links = Array.from(navEl.querySelectorAll('a'));
        var active = links.find(function(l){ return l.classList.contains('active') || (new URL(l.href, location.href).pathname === location.pathname); }) || links[0];
        var prevHref = sessionStorage.getItem('navClicked');
        var fromEl = prevHref ? links.find(function(l){ return l.getAttribute('href') === prevHref || new URL(l.href, location.href).pathname === new URL(prevHref, location.href).pathname; }) : null;
        try{ sessionStorage.removeItem('navClicked'); }catch(e){}

        var navRect = navEl.getBoundingClientRect();
        var aRect = active.getBoundingClientRect();

        // For bottom mobile nav we want horizontal indicator even on small screens
        var isSmallScreen = window.matchMedia('(max-width:800px)').matches;
        var treatAsVertical = isSmallScreen && !navEl.classList.contains('mobile-bottom-nav');

        var target = {};
        if(treatAsVertical){
          target.top = aRect.top - navRect.top + navEl.scrollTop;
          target.height = aRect.height;
          target.width = 6;
          target.left = 4;
        } else {
          target.left = aRect.left - navRect.left + navEl.scrollLeft;
          target.width = aRect.width;
        }

        if(fromEl){
          var fRect = fromEl.getBoundingClientRect();
          if(treatAsVertical){
            var fTop = fRect.top - navRect.top + navEl.scrollTop;
            indicator.style.transition = 'none';
            indicator.style.transform = 'translateY(' + (fTop) + 'px)';
            indicator.style.height = fRect.height + 'px';
            indicator.style.width = target.width + 'px';
            indicator.style.left = target.left + 'px';
            indicator.style.opacity = '1';
            requestAnimationFrame(function(){ requestAnimationFrame(function(){
              indicator.style.transition = 'transform .38s cubic-bezier(.2,.9,.2,1), height .28s cubic-bezier(.2,.9,.2,1)';
              indicator.style.transform = 'translateY(' + (target.top) + 'px)';
              indicator.style.height = target.height + 'px';
            }); });
          } else {
            var fLeft = fRect.left - navRect.left + navEl.scrollLeft;
            indicator.style.transition = 'none';
            indicator.style.transform = 'translateX(' + (fLeft) + 'px) translateY(-50%)';
            indicator.style.width = fRect.width + 'px';
            indicator.style.left = '0';
            indicator.style.opacity = '1';
            requestAnimationFrame(function(){ requestAnimationFrame(function(){
              indicator.style.transition = 'transform .38s cubic-bezier(.2,.9,.2,1), width .38s cubic-bezier(.2,.9,.2,1)';
              indicator.style.transform = 'translateX(' + (target.left) + 'px) translateY(-50%)';
              indicator.style.width = target.width + 'px';
            }); });
          }
        } else {
          if(treatAsVertical){
            indicator.style.transition = 'transform .38s cubic-bezier(.2,.9,.2,1), height .28s cubic-bezier(.2,.9,.2,1)';
            indicator.style.transform = 'translateY(' + (target.top) + 'px)';
            indicator.style.height = target.height + 'px';
            indicator.style.width = target.width + 'px';
            indicator.style.left = target.left + 'px';
            indicator.style.opacity = '1';
          } else {
            indicator.style.transition = 'transform .38s cubic-bezier(.2,.9,.2,1), width .38s cubic-bezier(.2,.9,.2,1)';
            indicator.style.transform = 'translateX(' + (target.left) + 'px) translateY(-50%)';
            indicator.style.width = target.width + 'px';
            indicator.style.left = '0';
            indicator.style.opacity = '1';
          }
        }
      }

      window.addEventListener('load', function(){ setTimeout(update, 60); });
      window.addEventListener('resize', function(){ setTimeout(update, 80); });
      var obs = new MutationObserver(function(){ setTimeout(update, 40); }); obs.observe(navEl, {attributes:true,childList:false,subtree:false});
      setTimeout(update, 40);
    });
  }
  initNavIndicator();

  // CTA pulse
  document.querySelectorAll('[data-cta]').forEach(function(el){
    el.addEventListener('mouseenter', function(){ el.classList.add('pulse'); });
    el.addEventListener('animationend', function(){ el.classList.remove('pulse'); });
  });

  // Order price live update
  var paket = document.getElementById('paket');
  var priceEl = document.getElementById('price');
  if(paket && priceEl){
    function updatePrice(){
      var opt = paket.options[paket.selectedIndex];
      var p = opt.getAttribute('data-price') || '0';
      priceEl.textContent = 'Rp' + (p.indexOf('.')>-1? p : (p+'k'));
    }
    paket.addEventListener('change', updatePrice); updatePrice();
  }

  // Simple form submit mock
  var orderForm = document.getElementById('orderForm');
  if(orderForm){
    orderForm.addEventListener('submit', function(e){
      e.preventDefault();
      var msg = document.getElementById('orderMsg');
      msg.textContent = 'Terima kasih! Permintaan Anda telah dikirim. Kami akan menghubungi dalam 1×24 jam.';
      orderForm.reset(); if(priceEl) updatePrice();
    });
  }

  // Smooth scroll for same-page anchors
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var t = document.querySelector(this.getAttribute('href'));
      if(t){ e.preventDefault(); t.scrollIntoView({behavior:'smooth',block:'center'}); }
    });
  });
})();

/* small CSS-invoked animation class fallback for CTA */
try{var style=document.createElement('style');style.textContent='[data-cta].pulse{animation:ctapulse .9s ease} @keyframes ctapulse{0%{transform:scale(1)}50%{transform:scale(1.06)}100%{transform:scale(1)}}';document.head.appendChild(style);}catch(e){}
