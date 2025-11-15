// Austin: NEW FILE - Notifications page with tabs and notification list
import React from 'react';

export const Notifications: React.FC = () => {
  return (
    <>
      <div className="sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm z-10">
        <div className="flex flex-wrap justify-between gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
          <p className="text-gray-900 dark:text-white text-2xl font-black leading-tight">Notifications</p>
        </div>
        <div className="pb-0">
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <a className="flex flex-col items-center justify-center border-b-[3px] border-b-primary pb-[13px] pt-4 flex-1" href="#">
              <p className="text-primary text-sm font-bold leading-normal tracking-[0.015em]">All</p>
            </a>
            <a className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-gray-500 dark:text-gray-400 pb-[13px] pt-4 flex-1 hover:bg-gray-100 dark:hover:bg-background-dark/80" href="#">
              <p className="text-sm font-bold leading-normal tracking-[0.015em]">Verified</p>
            </a>
            <a className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-gray-500 dark:text-gray-400 pb-[13px] pt-4 flex-1 hover:bg-gray-100 dark:hover:bg-background-dark/80" href="#">
              <p className="text-sm font-bold leading-normal tracking-[0.015em]">Mentions</p>
            </a>
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {/* Notification Item: Multiple Likes */}
        <div className="flex gap-4 p-4 hover:bg-gray-50 dark:hover:bg-background-dark/50 cursor-pointer bg-primary/10 dark:bg-primary/20 border-l-4 border-primary">
          <div className="shrink-0">
            <span className="material-symbols-outlined text-pink-500" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          </div>
          <div className="flex flex-1 flex-col justify-center">
            <div className="flex -space-x-2 mb-2">
              <img className="inline-block size-8 rounded-full ring-2 ring-background-light dark:ring-background-dark" alt="Avatar" src="https://ui-avatars.com/api/?name=John+Smith&background=random" />
              <img className="inline-block size-8 rounded-full ring-2 ring-background-light dark:ring-background-dark" alt="Avatar" src="https://ui-avatars.com/api/?name=Jane+Doe&background=random" />
              <img className="inline-block size-8 rounded-full ring-2 ring-background-light dark:ring-background-dark" alt="Avatar" src="https://ui-avatars.com/api/?name=Bob+Wilson&background=random" />
            </div>
            <p className="text-gray-800 dark:text-gray-100 text-base font-medium leading-normal">John Smith, Jane Doe and 2 others liked your post</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal mt-1">Post: "Had a great time at the designer conference today!..."</p>
          </div>
        </div>
        
        {/* Notification Item: Follow */}
        <div className="flex gap-4 p-4 hover:bg-gray-50 dark:hover:bg-background-dark/50 cursor-pointer">
          <div className="shrink-0">
            <span className="material-symbols-outlined text-green-500">person</span>
          </div>
          <div className="flex flex-1 flex-col justify-center">
            <div className="mb-2">
              <img className="inline-block size-8 rounded-full" alt="Avatar" src="https://ui-avatars.com/api/?name=Sarah+Miller&background=random" />
            </div>
            <p className="text-gray-800 dark:text-gray-100 text-base font-medium leading-normal">
              <span className="font-bold">Sarah Miller</span> followed you
              <span className="text-gray-500 dark:text-gray-400 text-sm font-normal ml-2">2h ago</span>
            </p>
          </div>
        </div>
        
        {/* Notification Item: Reply */}
        <div className="flex gap-4 p-4 hover:bg-gray-50 dark:hover:bg-background-dark/50 cursor-pointer">
          <div className="shrink-0">
            <span className="material-symbols-outlined text-primary">chat_bubble</span>
          </div>
          <div className="flex flex-1 flex-col justify-center">
            <div className="mb-2">
              <img className="inline-block size-8 rounded-full" alt="Avatar" src="https://ui-avatars.com/api/?name=Mike+Johnson&background=random" />
            </div>
            <p className="text-gray-800 dark:text-gray-100 text-base font-medium leading-normal">
              <span className="font-bold">Mike Johnson</span> replied to your post
              <span className="text-gray-500 dark:text-gray-400 text-sm font-normal ml-2">5h ago</span>
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal mt-1">Reply: "Absolutely! The keynote was fantastic..."</p>
          </div>
        </div>
        
        {/* Notification Item: Repost */}
        <div className="flex gap-4 p-4 hover:bg-gray-50 dark:hover:bg-background-dark/50 cursor-pointer">
          <div className="shrink-0">
            <span className="material-symbols-outlined text-green-500">repeat</span>
          </div>
          <div className="flex flex-1 flex-col justify-center">
            <div className="mb-2">
              <img className="inline-block size-8 rounded-full" alt="Avatar" src="https://ui-avatars.com/api/?name=Alex+Chen&background=random" />
            </div>
            <p className="text-gray-800 dark:text-gray-100 text-base font-medium leading-normal">
              <span className="font-bold">Alex Chen</span> reposted your post
              <span className="text-gray-500 dark:text-gray-400 text-sm font-normal ml-2">1d ago</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Notifications;
