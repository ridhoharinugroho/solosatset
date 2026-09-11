-- Read-only duplicate audit for production review.
-- DO NOT DELETE from production based on these queries alone.
-- Review canonical records and dependent listings/reviews first.

-- 1) Duplicate users by normalized email
SELECT
  lower(trim(email)) AS normalized_email,
  count(*) AS duplicate_count,
  array_agg(id ORDER BY created_at NULLS FIRST, id) AS user_ids
FROM public.users
WHERE email IS NOT NULL AND trim(email) <> ''
GROUP BY lower(trim(email))
HAVING count(*) > 1
ORDER BY duplicate_count DESC, normalized_email;

-- 2) Duplicate users by normalized phone
SELECT
  regexp_replace(phone, '\\D', '', 'g') AS normalized_phone,
  count(*) AS duplicate_count,
  array_agg(id ORDER BY created_at NULLS FIRST, id) AS user_ids
FROM public.users
WHERE phone IS NOT NULL AND trim(phone) <> ''
GROUP BY regexp_replace(phone, '\\D', '', 'g')
HAVING count(*) > 1
ORDER BY duplicate_count DESC, normalized_phone;

-- 3) Duplicate listings by seller + normalized title
SELECT
  seller_id,
  lower(regexp_replace(trim(title), '\\s+', ' ', 'g')) AS normalized_title,
  count(*) AS duplicate_count,
  array_agg(id ORDER BY created_at NULLS FIRST, id) AS listing_ids
FROM public.listings
WHERE title IS NOT NULL AND trim(title) <> ''
GROUP BY seller_id, lower(regexp_replace(trim(title), '\\s+', ' ', 'g'))
HAVING count(*) > 1
ORDER BY duplicate_count DESC, seller_id;

-- 4) Exact duplicate listing signatures (seller + title + price + description)
SELECT
  seller_id,
  md5(concat_ws('|', lower(trim(title)), price::text, lower(trim(coalesce(description, ''))))) AS duplicate_signature,
  count(*) AS duplicate_count,
  array_agg(id ORDER BY created_at NULLS FIRST, id) AS listing_ids
FROM public.listings
WHERE title IS NOT NULL
GROUP BY seller_id, md5(concat_ws('|', lower(trim(title)), price::text, lower(trim(coalesce(description, '')))))
HAVING count(*) > 1
ORDER BY duplicate_count DESC;

-- 5) Duplicate seller reviews by reviewer + seller + comment
SELECT
  seller_id,
  reviewer_id,
  md5(lower(trim(coalesce(comment, '')))) AS comment_signature,
  count(*) AS duplicate_count,
  array_agg(id ORDER BY created_at NULLS FIRST, id) AS review_ids
FROM public.seller_reviews
WHERE seller_id IS NOT NULL
GROUP BY seller_id, reviewer_id, md5(lower(trim(coalesce(comment, ''))))
HAVING count(*) > 1
ORDER BY duplicate_count DESC;

-- 6) Duplicate app reviews by reviewer + normalized comment
SELECT
  user_id,
  md5(lower(trim(coalesce(comment, '')))) AS comment_signature,
  count(*) AS duplicate_count,
  array_agg(id ORDER BY created_at NULLS FIRST, id) AS review_ids
FROM public.app_reviews
WHERE user_id IS NOT NULL
GROUP BY user_id, md5(lower(trim(coalesce(comment, ''))))
HAVING count(*) > 1
ORDER BY duplicate_count DESC;
