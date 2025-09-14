export default function BlogPostPage({ params }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900">Blog Post</h1>
        <p className="mt-4 text-lg text-gray-700">
          This is the page for the blog post with slug:
          <span className="ml-2 rounded-md bg-gray-100 px-2 py-1 font-mono text-blue-600">
            {params.slug}
          </span>
        </p>
        <p className="mt-4 text-gray-600">
          You are seeing this page because you are successfully logged in.
        </p>
      </div>
    </div>
  );
}
