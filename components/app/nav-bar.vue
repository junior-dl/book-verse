<template>
  <div class="navbar bg-primary text-primary-content shadow-sm">
    <div class="flex-1">
      <NuxtLink to="/" class="btn btn-ghost text-xl">
        BookVerse
      </NuxtLink>
    </div>
    <div class="flex gap-2">
      <!-- Search Bar -->
      <input type="text" placeholder="Search" class="input input-bordered w-24 md:w-auto">

      <!-- Button -->

      <div class="navbar-end">
        <a class="btn">Sign In <Icon name="fa7-solid:arrow-right-to-bracket" size="20" /> </a>
      </div>

      <!-- Profile -->
      <!-- <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
          <div class="w-10 rounded-full">
            <img
              alt="Tailwind CSS Navbar component"
              src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
            >
          </div>
        </div>
        <ul
          tabindex="-1"
          class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
        >
          <li>
            <a class="justify-between">
              Profile
              <span class="badge">New</span>
            </a>
          </li>
          <li><a>Settings</a></li>
          <li><a>Logout</a></li>
        </ul>
      </div> -->
    </div>
  </div>
</template>
