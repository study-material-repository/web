import {renderCheckbox} from '@kyralabs/m3e-elements/checkbox.js';
import '@kyralabs/m3e-elements/ripple.js';
import {MenuPopup} from '@kyralabs/m3e-elements/menu-popup.js';
import {DialogLayout} from '@kyralabs/m3e-elements/dialog-layout.js';
const dialogs = new WeakMap();
const primary = '#contribute-button,#new-dm,#message-compose>button,#send-coins-form>button,dialog button[type=submit]';
function enhance(root=document) {
  root.querySelectorAll('button').forEach(button=>{
    if(button.closest('.avatar-editor-grid,.avatar-palette'))return;
    if(button.matches('[role=menuitem]')){button.classList.add('m3e-menu__item');if(!button.querySelector('.material-symbols-outlined')){const icon=document.createElement('span');icon.className='material-symbols-outlined m3e-icon';icon.setAttribute('aria-hidden','true');icon.textContent=button.dataset.icon||({'Rename':'edit','Share':'share','Remove access':'person_remove','Who has access':'group','Move to trash':'delete','Copy':'content_copy','Cut':'content_cut','Paste':'content_paste'}[button.textContent.trim()])||'folder_open';button.prepend(icon);}return;}
    if(button.matches('[data-view],.m3e-menu__item,.tree-toggle,.tree-link,.chat-list-item'))return;
    if(button.matches('.classroom-card')){button.classList.add('m3e-card','m3e-card--interactive');return;}
    if(button.matches('.icon-button,.chat-action'))button.classList.add('m3e-icon-button');
    else {
      button.classList.add('m3e-button','m3e-button--size-s');
      button.classList.toggle('m3e-button--filled',button.matches(primary));
      button.classList.toggle('m3e-button--tonal',!button.matches(primary)&&!button.matches('.text-button'));
      button.classList.toggle('m3e-button--text',button.matches('.text-button'));
    }
  });
  root.querySelectorAll('.classroom-card').forEach(card=>card.removeAttribute('aria-label'));
  document.querySelector('#catalogue-tree')?.removeAttribute('role');
  root.querySelectorAll('.material-symbols-outlined').forEach(icon=>icon.classList.add('m3e-icon'));
  root.querySelectorAll('.resource-card,.review-card,.account-action-card,.balance-summary').forEach(card=>card.classList.add('m3e-card'));
  root.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]),textarea').forEach(input=>{
    if(input.closest('.m3e-text-field,.search,.task-search'))return;
    const wrapper=document.createElement('span');
    wrapper.className='m3e-text-field';
    const container=document.createElement('span');container.className='m3e-text-field__container';
    input.before(wrapper);wrapper.append(container);container.append(input);
    input.classList.add('m3e-text-field__input');
  });
  root.querySelectorAll('input[type=checkbox]').forEach(input=>{
    if(input.classList.contains('m3e-checkbox__input'))return;
    const label=input.closest('label');if(!label)return;
    const text=label.textContent.trim();
    const shell=document.createElement('label');
    const generated=renderCheckbox(shell,text);
    input.classList.add('m3e-checkbox__input');generated.replaceWith(input);
    label.classList.add('m3e-checkbox');label.replaceChildren(...shell.childNodes);
  });
  root.querySelectorAll('dialog').forEach(dialog=>{
    if(dialogs.has(dialog))return;
    const container=document.createElement('div');
    container.className='m3e-dialog__container';
    container.append(...dialog.childNodes);
    dialog.append(container);
    dialog.classList.add('m3e-dialog');
    const heading=dialog.querySelector('h1,h2');
    if(heading){heading.classList.add('m3e-dialog__headline');if(!heading.id)heading.id='dialog-'+crypto.randomUUID();dialog.setAttribute('aria-labelledby',heading.id);}
    else if(!dialog.hasAttribute('aria-label'))dialog.setAttribute('aria-label','Dialog');
    const layout=new DialogLayout(dialog);dialogs.set(dialog,layout);

  });
}
const navigation=document.querySelector('.app-navigation');
if(navigation){
 const media=matchMedia('(max-width:600px)');
 const adapt=()=>{navigation.classList.toggle('m3e-navigation-rail',!media.matches);navigation.classList.toggle('m3e-navigation-bar',media.matches);};
 adapt();media.addEventListener('change',adapt);
 navigation.querySelectorAll('button').forEach(button=>{
  const icon=button.querySelector('.material-symbols-outlined');
  const label=document.createElement('span');label.className='m3e-navigation-item__label';label.textContent=button.textContent.replace(icon.textContent,'').trim();
  const content=document.createElement('span');content.className='m3e-navigation-item__content';
  const indicator=document.createElement('span');indicator.className='m3e-navigation-item__indicator';
  const state=document.createElement('span');state.className='m3e-navigation-item__state';
  icon.classList.add('m3e-navigation-item__icon');content.append(indicator,state,icon,label);
  button.replaceChildren(content);button.classList.add('m3e-navigation-item');
 });
}
enhance();
new MutationObserver(records=>{
 if(records.some(r=>r.addedNodes.length))enhance();
}).observe(document.body,{childList:true,subtree:true});
window.SMRMaterial={enhance,MenuPopup,open(dialog){enhance();dialogs.get(dialog).setOpen(true);},close(dialog){dialogs.get(dialog)?.setOpen(false);}};

