// Austin: NEW FILE - Messages page with 2-column layout (conversations + chat)
import React from 'react';

export const Messages: React.FC = () => {
  return (
    <div className="flex h-screen flex-1">
      {/* Conversation List Panel */}
      <div className="flex h-full w-full max-w-sm flex-col border-r border-slate-200/10 bg-white dark:bg-background-dark">
        <div className="border-b border-slate-200/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-slate-900 dark:text-white text-2xl font-black leading-tight tracking-[-0.033em]">Messages</p>
            <button className="text-slate-600 dark:text-slate-400 hover:text-primary">
              <span className="material-symbols-outlined">drafts</span>
            </button>
          </div>
          <div className="mt-4">
            <label className="flex flex-col min-w-40 h-11 w-full">
              <div className="flex w-full flex-1 items-stretch rounded-full h-full">
                <div className="text-slate-500 dark:text-slate-400 flex border-none bg-slate-100 dark:bg-slate-800/50 items-center justify-center pl-4 rounded-l-full border-r-0">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-full text-slate-900 dark:text-white focus:outline-0 focus:ring-0 border-none bg-slate-100 dark:bg-slate-800/50 focus:border-none h-full placeholder:text-slate-500 dark:placeholder:text-slate-400 px-4 rounded-l-none border-l-0 pl-2 text-sm font-normal leading-normal" placeholder="Search Direct Messages" defaultValue="" />
              </div>
            </label>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {/* Active Conversation Item */}
          <div className="flex cursor-pointer items-center gap-4 bg-primary/10 dark:bg-primary/20 px-4 min-h-[72px] py-3 justify-between border-r-2 border-primary">
            <div className="flex items-center gap-4">
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12" style={{ backgroundImage: "url('https://ui-avatars.com/api/?name=Sarah+Wilson&background=random')" }}></div>
              <div className="flex flex-col justify-center">
                <p className="text-slate-900 dark:text-white text-base font-bold leading-tight">Sarah Wilson</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal">You: That sounds great! Let's...</p>
              </div>
            </div>
            <div className="shrink-0">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-normal leading-normal">2m</p>
            </div>
          </div>
          
          {/* Conversation Item */}
          <div className="flex cursor-pointer items-center gap-4 bg-transparent px-4 min-h-[72px] py-3 justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <div className="flex items-center gap-4">
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12" style={{ backgroundImage: "url('https://ui-avatars.com/api/?name=John+Doe&background=random')" }}></div>
              <div className="flex flex-col justify-center">
                <p className="text-slate-900 dark:text-white text-base font-bold leading-tight">John Doe</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal">Thanks for the info!</p>
              </div>
            </div>
            <div className="shrink-0">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-normal leading-normal">1h</p>
            </div>
          </div>
          
          {/* Conversation Item */}
          <div className="flex cursor-pointer items-center gap-4 bg-transparent px-4 min-h-[72px] py-3 justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <div className="flex items-center gap-4">
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12" style={{ backgroundImage: "url('https://ui-avatars.com/api/?name=Emily+Chen&background=random')" }}></div>
              <div className="flex flex-col justify-center">
                <p className="text-slate-900 dark:text-white text-base font-bold leading-tight">Emily Chen</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal">See you tomorrow!</p>
              </div>
            </div>
            <div className="shrink-0">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-normal leading-normal">2d</p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State - Right Panel */}
      <div className="flex h-full flex-1 flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 p-12 text-center">
        <div className="max-w-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">You don't have a message selected</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Choose one from your existing messages, or start a new one.</p>
          <button className="mt-6 flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-11 px-6 bg-primary text-white text-sm font-bold leading-normal tracking-wide mx-auto">
            <span className="truncate">New Message</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Messages;
