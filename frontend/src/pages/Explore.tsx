// Austin: NEW FILE - Explore page with search and trending content
import React from 'react';

export const Explore: React.FC = () => {
  return (
    <>
      <div className="sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
        <div className="px-4 py-3">
          <label className="flex flex-col min-w-40 h-12 w-full">
            <div className="flex w-full flex-1 items-stretch rounded-full h-full">
              <div className="text-[#9caeba] flex border-none bg-slate-200 dark:bg-[#283239] items-center justify-center pl-4 rounded-l-full border-r-0">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input 
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-full text-black dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border-none bg-slate-200 dark:bg-[#283239] focus:border-none h-full placeholder:text-slate-500 dark:placeholder:text-[#9caeba] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal" 
                placeholder="Search" 
                defaultValue=""
              />
            </div>
          </label>
        </div>
        <div className="border-b border-slate-200 dark:border-[#3b4a54]">
          <div className="flex justify-between">
            <a className="flex flex-col items-center justify-center border-b-2 border-b-primary text-primary pb-3 pt-4 flex-1 hover:bg-primary/10 transition-colors" href="#">
              <p className="text-base font-bold">For you</p>
            </a>
            <a className="flex flex-col items-center justify-center border-b-2 border-b-transparent text-slate-500 dark:text-[#9caeba] pb-3 pt-4 flex-1 hover:bg-primary/10 transition-colors" href="#">
              <p className="text-base font-bold">Trending</p>
            </a>
            <a className="flex flex-col items-center justify-center border-b-2 border-b-transparent text-slate-500 dark:text-[#9caeba] pb-3 pt-4 flex-1 hover:bg-primary/10 transition-colors" href="#">
              <p className="text-base font-bold">News</p>
            </a>
            <a className="flex flex-col items-center justify-center border-b-2 border-b-transparent text-slate-500 dark:text-[#9caeba] pb-3 pt-4 flex-1 hover:bg-primary/10 transition-colors" href="#">
              <p className="text-base font-bold">Sports</p>
            </a>
          </div>
        </div>
      </div>
      
      {/* Feed Content */}
      <div className="divide-y divide-slate-200 dark:divide-[#3b4a54]">
        {/* Post 1 */}
        <article className="p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors duration-200">
          <div className="w-12 h-12 flex-shrink-0">
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12" style={{ backgroundImage: "url('https://ui-avatars.com/api/?name=NASA&background=1ca0f2')" }}></div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-black dark:text-white">NASA</p>
              <p className="text-slate-500 dark:text-gray-400">@NASA · 2h</p>
            </div>
            <p className="mt-1 text-black dark:text-white">Stunning new images from the James Webb Space Telescope reveal intricate details of the Orion Nebula. A cosmic masterpiece! ✨ #JWST #Space</p>
            <div className="mt-3 rounded-xl border border-slate-200 dark:border-[#3b4a54] overflow-hidden">
              <div className="w-full bg-center bg-no-repeat aspect-video bg-cover" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=600')" }}></div>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 justify-between max-w-sm">
              <button className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary group">
                <div className="p-2 rounded-full group-hover:bg-primary/10">
                  <span className="material-symbols-outlined text-xl">chat_bubble</span>
                </div>
                <p className="text-xs font-normal">234</p>
              </button>
              <button className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-green-500 group">
                <div className="p-2 rounded-full group-hover:bg-green-500/10">
                  <span className="material-symbols-outlined text-xl">repeat</span>
                </div>
                <p className="text-xs font-normal">1.2k</p>
              </button>
              <button className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-pink-500 group">
                <div className="p-2 rounded-full group-hover:bg-pink-500/10">
                  <span className="material-symbols-outlined text-xl">favorite</span>
                </div>
                <p className="text-xs font-normal">5.6k</p>
              </button>
              <button className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary group">
                <div className="p-2 rounded-full group-hover:bg-primary/10">
                  <span className="material-symbols-outlined text-xl">ios_share</span>
                </div>
              </button>
            </div>
          </div>
        </article>
        
        {/* Post 2 */}
        <article className="p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors duration-200">
          <div className="w-12 h-12 flex-shrink-0">
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12" style={{ backgroundImage: "url('https://ui-avatars.com/api/?name=TechCrunch&background=00ff00')" }}></div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-black dark:text-white">TechCrunch</p>
              <p className="text-slate-500 dark:text-gray-400">@TechCrunch · 5h</p>
            </div>
            <p className="mt-1 text-black dark:text-white">Quantum computing startup "QubitLeap" just raised a $150M Series B to build the world's most powerful quantum processor. Is the future of computing finally here?</p>
            <div className="flex flex-wrap gap-4 mt-3 justify-between max-w-sm">
              <button className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary group">
                <div className="p-2 rounded-full group-hover:bg-primary/10">
                  <span className="material-symbols-outlined text-xl">chat_bubble</span>
                </div>
                <p className="text-xs font-normal">89</p>
              </button>
              <button className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-green-500 group">
                <div className="p-2 rounded-full group-hover:bg-green-500/10">
                  <span className="material-symbols-outlined text-xl">repeat</span>
                </div>
                <p className="text-xs font-normal">456</p>
              </button>
              <button className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-pink-500 group">
                <div className="p-2 rounded-full group-hover:bg-pink-500/10">
                  <span className="material-symbols-outlined text-xl">favorite</span>
                </div>
                <p className="text-xs font-normal">2.1k</p>
              </button>
              <button className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary group">
                <div className="p-2 rounded-full group-hover:bg-primary/10">
                  <span className="material-symbols-outlined text-xl">ios_share</span>
                </div>
              </button>
            </div>
          </div>
        </article>
      </div>
    </>
  );
};

export default Explore;
