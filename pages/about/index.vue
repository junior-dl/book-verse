<template>
  <div>
    <!-- Hero -->
    <section class="hero min-h-screen bg-base-200">
      <div class="hero-content text-center">
        <div class="max-w-4xl">
          <h1 class="text-5xl md:text-6xl font-bold">
            Discover, Organize, and Share Your Reading Journey
          </h1>

          <p class="py-8 text-lg opacity-80">
            BookVerse is a social reading platform where readers can discover books,
            build personalized shelves, write reviews, and connect with fellow book
            lovers. Whether you're keeping track of your next read or sharing your
            favorite stories, BookVerse brings your reading journey together in one place.
          </p>

          <div class="flex flex-wrap justify-center gap-4">
            <NuxtLink class="btn btn-primary" to="/">
              Explore Books
            </NuxtLink>

            <NuxtLink class="btn btn-outline" to="/sign-up">
              Join BookVerse
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Hero 2 -->
    <section class="py-24 bg-base-100">
      <div class="container mx-auto px-6 max-w-4xl text-center">
        <div class="badge badge-primary mb-4">
          Our Mission
        </div>

        <h2 class="text-4xl font-bold mb-8">
          Why BookVerse Exists
        </h2>

        <div class="space-y-6 text-lg opacity-80 leading-8">
          <p>
            BookVerse was created with one goal in mind:
            to make reading more connected and enjoyable.
          </p>

          <p>
            Many readers use different apps and websites to discover books,
            organize their collections, and share recommendations.
            BookVerse brings these experiences together into a single platform
            designed for readers of every kind.
          </p>

          <p>
            Whether you're building your first reading list or have shelves full of
            favorites, BookVerse helps you discover stories, organize your library,
            and connect with people who love books just as much as you do.
          </p>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-24 bg-base-200">
      <div class="container mx-auto px-6">
        <div class="text-center mb-14">
          <div class="badge badge-secondary mb-4">
            Features
          </div>

          <h2 class="text-4xl font-bold">
            Everything You Need in One Place
          </h2>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <div class="text-4xl">
                📚
              </div>
              <h3 class="card-title">
                Discover Books
              </h3>
              <p>Browse thousands of titles across different genres and authors.</p>
            </div>
          </div>

          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <div class="text-4xl">
                ⭐
              </div>
              <h3 class="card-title">
                Build Your Shelves
              </h3>
              <p>Save favorites and organize books into personalized collections.</p>
            </div>
          </div>

          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <div class="text-4xl">
                ✍️
              </div>
              <h3 class="card-title">
                Write Reviews
              </h3>
              <p>Share your thoughts and help others discover great reads.</p>
            </div>
          </div>

          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <div class="text-4xl">
                👥
              </div>
              <h3 class="card-title">
                Connect
              </h3>
              <p>Explore what other readers are enjoying.</p>
            </div>
          </div>

          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <div class="text-4xl">
                🔍
              </div>
              <h3 class="card-title">
                Search
              </h3>
              <p>Find books by title, author, or ISBN.</p>
            </div>
          </div>

          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <div class="text-4xl">
                📖
              </div>
              <h3 class="card-title">
                Track Progress
              </h3>
              <p>Keep a record of books you've read and those you plan to read.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Meet the Developer -->
    <section class="hero py-24 bg-base-100">
      <div class="hero-content flex-col lg:flex-row gap-12">
        <!-- <div class="avatar">
          <div class="w-56 rounded-full ring ring-primary ring-offset-base-100 ring-offset-4">
            <img src="/me.JPEG" alt="Developer">
          </div>
        </div> -->

        <div class="max-w-xl">
          <div class="badge badge-accent mb-4">
            Meet the Developer
          </div>

          <h2 class="text-4xl font-bold mb-6">
            Hi, I'm Justine 👋
          </h2>

          <p class="mb-4 opacity-80">
            I'm a Information Technology graduate and full-stack developer passionate
            about building practical web applications.
          </p>

          <p class="opacity-80">
            BookVerse started as a way to combine my love for software
            development with the reading community. It has become a project
            where I continue learning modern technologies while creating
            something useful for fellow readers.
          </p>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="hero py-28 bg-primary text-primary-content">
      <div class="hero-content text-center">
        <div class="max-w-2xl">
          <h2 class="text-5xl font-bold">
            Ready to Start Your Reading Journey?
          </h2>

          <p class="py-8 text-lg">
            Join BookVerse today and discover books, organize your library,
            and connect with a growing community of readers.
          </p>

          <NuxtLink
            class="btn btn-secondary btn-lg"
            to="/sign-up"
          >
            Join BookVerse
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
