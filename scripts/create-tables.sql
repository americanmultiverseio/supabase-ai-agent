-- conversations table
create table public.conversations (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  message text not null,
  response text not null,
  embedding public.vector null,
  sources text null,
  created_at timestamp with time zone null default now(),
  constraint conversations_pkey primary key (id),
  constraint conversations_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists conversations_embedding_idx on public.conversations using ivfflat (embedding vector_cosine_ops)
with
  (lists = '100') TABLESPACE pg_default;


  -- documents table
  create table public.documents (
  id bigserial not null,
  content text null,
  metadata jsonb null,
  embedding public.vector null,
  constraint documents_pkey1 primary key (id)
) TABLESPACE pg_default;