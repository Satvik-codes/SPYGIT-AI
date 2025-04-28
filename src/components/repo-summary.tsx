import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { githubApi } from '@/lib/github';
import { generateRepoSummary } from '@/lib/ai';
import { Loader2 } from 'lucide-react';

interface RepoSummaryProps {
  username: string;
  repo: string;
}

export function RepoSummary({ username, repo }: RepoSummaryProps) {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['repo-summary', username, repo],
    queryFn: async () => {
      // First, get the repo data
      const repoData = await githubApi.getRepos(username).then(repos => 
        repos.find(r => r.name === repo)
      );

      if (!repoData) throw new Error('Repository not found');

      // Now fetch languages and README using the correct default branch
      const [languages, readme] = await Promise.all([
        githubApi.getLanguages(username, repo),
        githubApi.getReadme(username, repo, repoData.default_branch || 'main'),
      ]);

      const languageList = Object.keys(languages);

      return generateRepoSummary(
        repoData.name,
        repoData.description || '',
        readme,
        languageList
      );
    },
    enabled: !!username && !!repo,
  });

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          AI-Generated Summary
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-24 flex items-center justify-center text-muted-foreground">
            Analyzing repository...
          </div>
        ) : (
          <div className="prose prose-neutral dark:prose-invert">
            <p className="text-muted-foreground">{summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
