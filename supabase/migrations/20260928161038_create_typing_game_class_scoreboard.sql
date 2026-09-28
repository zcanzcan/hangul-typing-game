create extension if not exists pgcrypto with schema extensions;

create schema if not exists typing_game_private;
revoke all on schema typing_game_private from public;
grant usage on schema typing_game_private to anon, authenticated;

create or replace function typing_game_private.request_header(header_name text)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select nullif(
    coalesce(
      nullif(current_setting('request.headers', true), ''),
      '{}'
    )::jsonb ->> lower(header_name),
    ''
  );
$$;

create or replace function typing_game_private.request_class_code()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select upper(trim(typing_game_private.request_header('x-typing-class-code')));
$$;

create or replace function typing_game_private.request_editor_token_hash()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select case
    when typing_game_private.request_header('x-typing-editor-token')
      ~ '^[0-9a-fA-F-]{36}$'
    then encode(
      extensions.digest(
        convert_to(
          typing_game_private.request_header('x-typing-editor-token'),
          'UTF8'
        ),
        'sha256'
      ),
      'hex'
    )
    else null
  end;
$$;

revoke all on function typing_game_private.request_header(text) from public;
revoke all on function typing_game_private.request_class_code() from public;
revoke all on function typing_game_private.request_editor_token_hash() from public;
grant execute on function typing_game_private.request_header(text) to anon, authenticated;
grant execute on function typing_game_private.request_class_code() to anon, authenticated;
grant execute on function typing_game_private.request_editor_token_hash() to anon, authenticated;

create table public.typing_game_classes (
  id uuid primary key default gen_random_uuid(),
  class_code text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  constraint typing_game_classes_code_format
    check (class_code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  constraint typing_game_classes_expiry_after_creation
    check (expires_at > created_at)
);

create table public.typing_game_scores (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.typing_game_classes(id) on delete cascade,
  nickname text not null,
  score integer not null,
  mode text not null,
  stage smallint not null,
  played_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  editor_token_hash text not null
    default typing_game_private.request_editor_token_hash(),
  constraint typing_game_scores_nickname_length
    check (nickname = trim(nickname) and char_length(nickname) between 1 and 20),
  constraint typing_game_scores_score_range
    check (score between 0 and 1000000000),
  constraint typing_game_scores_mode
    check (mode in ('position', 'word', 'sentence', 'minigame', 'slang')),
  constraint typing_game_scores_stage_range
    check (stage between 1 and 999),
  constraint typing_game_scores_editor_token_hash
    check (editor_token_hash ~ '^[0-9a-f]{64}$')
);

create index typing_game_classes_expires_at_idx
  on public.typing_game_classes (expires_at);
create index typing_game_scores_class_ranking_idx
  on public.typing_game_scores (class_id, score desc, played_at asc);

alter table public.typing_game_classes enable row level security;
alter table public.typing_game_scores enable row level security;

create policy typing_game_classes_read_current_class
on public.typing_game_classes
for select
to anon, authenticated
using (
  expires_at > now()
  and class_code = typing_game_private.request_class_code()
);

create policy typing_game_classes_create_current_class
on public.typing_game_classes
for insert
to anon, authenticated
with check (
  class_code = typing_game_private.request_class_code()
  and expires_at <= now() + interval '31 days'
);

create policy typing_game_scores_read_current_class
on public.typing_game_scores
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.typing_game_classes as classes
    where classes.id = typing_game_scores.class_id
      and classes.expires_at > now()
      and classes.class_code = typing_game_private.request_class_code()
  )
);

create policy typing_game_scores_create_current_class
on public.typing_game_scores
for insert
to anon, authenticated
with check (
  editor_token_hash = typing_game_private.request_editor_token_hash()
  and exists (
    select 1
    from public.typing_game_classes as classes
    where classes.id = typing_game_scores.class_id
      and classes.expires_at > now()
      and classes.class_code = typing_game_private.request_class_code()
  )
);

create policy typing_game_scores_update_owned_entry
on public.typing_game_scores
for update
to anon, authenticated
using (
  editor_token_hash = typing_game_private.request_editor_token_hash()
  and exists (
    select 1
    from public.typing_game_classes as classes
    where classes.id = typing_game_scores.class_id
      and classes.expires_at > now()
      and classes.class_code = typing_game_private.request_class_code()
  )
)
with check (
  editor_token_hash = typing_game_private.request_editor_token_hash()
  and exists (
    select 1
    from public.typing_game_classes as classes
    where classes.id = typing_game_scores.class_id
      and classes.expires_at > now()
      and classes.class_code = typing_game_private.request_class_code()
  )
);

create policy typing_game_scores_delete_owned_entry
on public.typing_game_scores
for delete
to anon, authenticated
using (
  editor_token_hash = typing_game_private.request_editor_token_hash()
  and exists (
    select 1
    from public.typing_game_classes as classes
    where classes.id = typing_game_scores.class_id
      and classes.expires_at > now()
      and classes.class_code = typing_game_private.request_class_code()
  )
);

revoke all on table public.typing_game_classes from anon, authenticated;
revoke all on table public.typing_game_scores from anon, authenticated;

grant select (id, class_code, created_at, expires_at),
  insert (class_code)
on table public.typing_game_classes
to anon, authenticated;

grant select (id, class_id, nickname, score, mode, stage, played_at, created_at),
  insert (class_id, nickname, score, mode, stage, played_at),
  update (nickname, score, mode, stage, played_at),
  delete
on table public.typing_game_scores
to anon, authenticated;

comment on table public.typing_game_classes is
  '한글 타자 게임 반 코드. 개인 식별 정보 없이 30일 뒤 만료된다.';
comment on table public.typing_game_scores is
  '반 코드별 닉네임과 타자 점수. 실명, 연락처, 계정, 기기 식별자는 저장하지 않는다.';
