'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { useState } from 'react';
const dummyBlogs = [
  {
    slug: 'navigating-corporate-litigation',
    title: 'Navigating the Complexities of Corporate Litigation',
    description: 'A deep dive into the strategic decisions behind high-stakes corporate legal battles.',
    author: 'Eleanor Vance',
    date: 'Sep 12, 2025',
    imageUrl: 'https://placehold.co/600x400/0B2447/FFFFFF?text=Corporate+Law',
  },
  {
    slug: 'intellectual-property-in-the-digital-age',
    title: 'Intellectual Property in the Digital Age',
    description: 'How to protect your digital assets in an increasingly connected world.',
    author: 'Marcus Thorne',
    date: 'Sep 10, 2025',
    imageUrl: 'https://placehold.co/600x400/19376D/FFFFFF?text=IP+Law',
  },
  {
    slug: 'the-future-of-environmental-law',
    title: 'The Future of Environmental Law and Policy',
    description: 'Exploring upcoming regulations and their potential impact on global industries.',
    author: 'Aria Sterling',
    date: 'Sep 8, 2025',
    imageUrl: 'https://placehold.co/600x400/576CBC/FFFFFF?text=Environment',
  },
  {
    slug: 'ai-and-the-legal-profession',
    title: 'Artificial Intelligence and the Legal Profession',
    description: 'Analyzing how AI is transforming legal research, case management, and courtroom outcomes.',
    author: 'Julian Croft',
    date: 'Sep 5, 2025',
    imageUrl: 'https://placehold.co/600x400/A5D7E8/000000?text=AI+%26+Law',
  },
  {
    slug: 'understanding-international-trade-law',
    title: 'Understanding International Trade Law',
    description: 'A primer on the treaties and disputes that shape the global economy.',
    author: 'Isabelle Rossi',
    date: 'Sep 2, 2025',
    imageUrl: 'https://placehold.co/600x400/19376D/FFFFFF?text=Trade+Law',
  },
  {
    slug: 'real-estate-law-common-pitfalls',
    title: 'Real Estate Law: Common Pitfalls for New Investors',
    description: 'Avoid these common legal mistakes when buying or selling property.',
    author: 'Nathaniel Hayes',
    date: 'Aug 30, 2025',
    imageUrl: 'https://placehold.co/600x400/576CBC/FFFFFF?text=Real+Estate',
  },
];


export default function Home() {
  const { user } = useUser();
  const [apiMessage, setApiMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">From the Blog</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">
            Expert analysis on the latest trends shaping the legal world.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-3">
          {dummyBlogs.map((post) => (
            <Link
              key={post.title}
              href={user ? `/blogs/${post.slug}` : '/api/auth/login'}
              className="flex flex-col overflow-hidden rounded-lg shadow-lg transition-transform hover:scale-105"
            >
              <div className="flex-shrink-0">
                <img className="h-48 w-full object-cover" src={post.imageUrl} alt={post.title} />
              </div>
              <div className="flex flex-1 flex-col justify-between bg-white p-6">
                <div className="flex-1">
                  <p className="text-xl font-semibold text-gray-900">{post.title}</p>
                  <p className="mt-3 text-base text-gray-600">{post.description}</p>
                </div>
                <div className="mt-6 flex items-center">
                  <div className="text-sm text-gray-500">
                    <span>By {post.author}</span>
                    <span className="mx-1">&middot;</span>
                    <time dateTime={post.date}>{post.date}</time>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

