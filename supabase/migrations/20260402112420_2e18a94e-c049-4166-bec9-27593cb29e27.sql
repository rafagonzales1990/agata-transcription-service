
-- Team: allow authenticated users to INSERT (create a team)
CREATE POLICY "Users can create teams"
ON public."Team"
FOR INSERT
TO authenticated
WITH CHECK ((auth.uid())::text = "ownerId");

-- Team: allow owner to UPDATE
CREATE POLICY "Team owner can update team"
ON public."Team"
FOR UPDATE
TO authenticated
USING ((auth.uid())::text = "ownerId");

-- Team: allow owner to DELETE
CREATE POLICY "Team owner can delete team"
ON public."Team"
FOR DELETE
TO authenticated
USING ((auth.uid())::text = "ownerId");

-- Team: allow team members to SELECT their team
CREATE POLICY "Team members can view their team"
ON public."Team"
FOR SELECT
TO authenticated
USING (
  (auth.uid())::text = "ownerId"
  OR id IN (SELECT "teamId" FROM public."User" WHERE id = (auth.uid())::text)
);

-- WorkGroup: allow team owner to INSERT
CREATE POLICY "Team owner can create work groups"
ON public."WorkGroup"
FOR INSERT
TO authenticated
WITH CHECK (
  "teamId" IN (SELECT id FROM public."Team" WHERE "ownerId" = (auth.uid())::text)
);

-- WorkGroup: allow team owner to UPDATE
CREATE POLICY "Team owner can update work groups"
ON public."WorkGroup"
FOR UPDATE
TO authenticated
USING (
  "teamId" IN (SELECT id FROM public."Team" WHERE "ownerId" = (auth.uid())::text)
);

-- WorkGroup: allow team owner to DELETE
CREATE POLICY "Team owner can delete work groups"
ON public."WorkGroup"
FOR DELETE
TO authenticated
USING (
  "teamId" IN (SELECT id FROM public."Team" WHERE "ownerId" = (auth.uid())::text)
);

-- WorkGroupMember: allow team owner to INSERT members
CREATE POLICY "Team owner can add work group members"
ON public."WorkGroupMember"
FOR INSERT
TO authenticated
WITH CHECK (
  "workGroupId" IN (
    SELECT wg.id FROM public."WorkGroup" wg
    JOIN public."Team" t ON t.id = wg."teamId"
    WHERE t."ownerId" = (auth.uid())::text
  )
);

-- WorkGroupMember: allow team owner to UPDATE members
CREATE POLICY "Team owner can update work group members"
ON public."WorkGroupMember"
FOR UPDATE
TO authenticated
USING (
  "workGroupId" IN (
    SELECT wg.id FROM public."WorkGroup" wg
    JOIN public."Team" t ON t.id = wg."teamId"
    WHERE t."ownerId" = (auth.uid())::text
  )
);

-- WorkGroupMember: allow team owner to DELETE members
CREATE POLICY "Team owner can remove work group members"
ON public."WorkGroupMember"
FOR DELETE
TO authenticated
USING (
  "workGroupId" IN (
    SELECT wg.id FROM public."WorkGroup" wg
    JOIN public."Team" t ON t.id = wg."teamId"
    WHERE t."ownerId" = (auth.uid())::text
  )
);
