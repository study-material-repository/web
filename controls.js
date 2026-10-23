(() => {
  document.querySelector('.brand > span')?.remove();
  document.querySelector('.catalogue-card-heading .eyebrow')?.remove();
  document.querySelector('.legend')?.remove();
  document.querySelectorAll('input[type="password"]').forEach(input => {
    const wrapper=document.createElement('span');wrapper.className='password-control';input.before(wrapper);wrapper.append(input);
    const toggle=document.createElement('button');toggle.type='button';toggle.className='icon-button';toggle.setAttribute('aria-label','Show password');toggle.innerHTML='<span class="material-symbols-outlined" aria-hidden="true">visibility</span>';wrapper.append(toggle);
    let timer;
    function hide(){clearTimeout(timer);input.type='password';toggle.setAttribute('aria-label','Show password');toggle.setAttribute('aria-pressed','false');}
    toggle.onclick=()=>{if(input.type==='text')return hide();input.type='text';toggle.setAttribute('aria-label','Hide password');toggle.setAttribute('aria-pressed','true');timer=setTimeout(hide,10000);};
    input.form?.addEventListener('submit',hide);document.addEventListener('visibilitychange',hide);input.closest('dialog')?.addEventListener('close',hide);
  });
  document.querySelectorAll('.school-input input').forEach(input=>{const suffix=input.nextElementSibling;const update=()=>{if(suffix)suffix.hidden=input.value.includes('@');};input.addEventListener('input',update);update();input.placeholder='Username or invited email';});
  const icons={rename:'edit',create:'create_new_folder',grant:'person_add',revoke:'person_remove',permissions:'info',trash:'delete',copy:'content_copy',cut:'content_cut',paste:'content_paste',cascade:'unfold_more'};
  document.querySelectorAll('[data-admin-action],#tree-copy,#tree-cut,#tree-paste,#tree-cascade').forEach(button=>button.dataset.icon=icons[button.dataset.adminAction||button.id.replace('tree-','')]);
})();
