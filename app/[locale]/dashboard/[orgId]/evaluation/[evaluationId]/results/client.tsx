/**
 * Evaluation Results Client Component
 * 
 * Displays the final evaluation results including scores and grade
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertCircle, Download, Printer, ArrowLeft, Award } from 'lucide-react';
import { executeQuery } from '@/lib/nhost/graphql/client';
import { FactorContributionChart } from '@/components/evaluation/FactorContributionChart';

const GET_EVALUATION_RESULTS = `
  query GetEvaluationResults($evaluationId: uuid!, $locale: String!) {
    # Main evaluation with score
    v_evaluation_complete(where: { evaluation_id: { _eq: $evaluationId } }) {
      evaluation_id
      position_id
      evaluated_by
      status
      completed_at
      final_score
      assigned_grade
      min_score
      max_score
      typical_role_tr
      typical_role_en
      calculated_at
    }
    
    # Position details
    position_evaluations_by_pk(id: $evaluationId) {
      position {
        pos_code
        title
        department {
          dept_code
          name
        }
      }
    }
    
    # Factor breakdown
    v_evaluation_factor_breakdown(
      where: { evaluation_id: { _eq: $evaluationId }, language: { _eq: $locale } }
      order_by: { order_index: asc }
    ) {
      factor_code
      factor_name
      total_points
      weighted_points
      order_index
    }
    
    # Dimension details
    v_evaluation_dimension_details(
      where: { evaluation_id: { _eq: $evaluationId }, language: { _eq: $locale } }
      order_by: [{ factor_order: asc }, { order_index: asc }]
    ) {
      dimension_code
      dimension_name
      max_level
      selected_level
      raw_points
      weighted_points
      factor_code
      factor_name
      factor_order
      order_index
    }
  }
`;

interface EvaluationResult {
  evaluation_id: string;
  final_score: number;
  assigned_grade: number;
  min_score: number;
  max_score: number;
  typical_role_tr: string;
  typical_role_en: string;
  completed_at: string;
  calculated_at: string;
}

interface FactorBreakdown {
  factor_code: string;
  factor_name: string;
  total_points: number;
  weighted_points: number;
  order_index: number;
}

interface DimensionDetail {
  dimension_code: string;
  dimension_name: string;
  max_level: number;
  selected_level: number;
  raw_points: number;
  weighted_points: number;
  factor_code: string;
  factor_name: string;
}

interface EvaluationResultsClientProps {
  evaluationId: string;
  orgId: string;
  locale: string;
}

export function EvaluationResultsClient({ 
  evaluationId, 
  orgId, 
  locale 
}: EvaluationResultsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    evaluation: EvaluationResult | null;
    position: any;
    factors: FactorBreakdown[];
    dimensions: DimensionDetail[];
  }>({ evaluation: null, position: null, factors: [], dimensions: [] });

  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);
        
        // Defensive check
        if (!evaluationId) {
          throw new Error('Evaluation ID is missing');
        }
        
        console.log('Fetching results for evaluation:', evaluationId, 'locale:', locale);
        const data = await executeQuery(GET_EVALUATION_RESULTS, { evaluationId, locale });
        
        if (!data.v_evaluation_complete || data.v_evaluation_complete.length === 0) {
          throw new Error('Results not found. The evaluation may not be completed yet.');
        }
        
        setResults({
          evaluation: data.v_evaluation_complete[0],
          position: data.position_evaluations_by_pk?.position || null,
          factors: data.v_evaluation_factor_breakdown || [],
          dimensions: data.v_evaluation_dimension_details || []
        });
        
      } catch (err) {
        console.error('Error fetching results:', err);
        setError(err instanceof Error ? err.message : 'Failed to load results');
      } finally {
        setLoading(false);
      }
    }
    
    fetchResults();
  }, [evaluationId, locale]);

  // Show congratulatory toast on first load
  useEffect(() => {
    if (results.evaluation && !loading) {
      // Check if this is first view
      const hasSeenResults = sessionStorage.getItem(`results-seen-${evaluationId}`);
      
      if (!hasSeenResults) {
        toast.success('Evaluation Complete!', {
          description: `Final Score: ${results.evaluation.final_score.toFixed(2)} | Grade ${results.evaluation.assigned_grade}`,
          duration: 5000,
        });
        sessionStorage.setItem(`results-seen-${evaluationId}`, 'true');
      }
    }
  }, [results, loading, evaluationId]);

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-3 text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !results.evaluation) {
    return (
      <div className="container max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Failed to load results'}</AlertDescription>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push(`/${locale}/dashboard/${orgId}/org-structure/positions`)}
          >
            Back to Positions
          </Button>
        </Alert>
      </div>
    );
  }

  const { evaluation, position, factors, dimensions } = results;
  const typicalRole = locale === 'tr' ? evaluation.typical_role_tr : evaluation.typical_role_en;
  
  const exportToCSV = () => {
    const csvContent = [
      ['Position', position?.title || ''],
      ['Code', position?.pos_code || ''],
      ['Final Score', evaluation.final_score],
      ['Grade', evaluation.assigned_grade],
      ['Role', typicalRole],
      [''],
      ['Factor', 'Total Points', 'Weighted Points'],
      ...factors.map(f => [
        f.factor_name,
        f.total_points.toFixed(2),
        f.weighted_points.toFixed(2)
      ]),
      [''],
      ['Dimension', 'Factor', 'Selected Level', 'Max Level', 'Raw Points', 'Weighted Points'],
      ...dimensions.map(d => [
        d.dimension_name,
        d.factor_name,
        `S${d.selected_level}`,
        `S${d.max_level}`,
        d.raw_points,
        d.weighted_points.toFixed(2)
      ])
    ];
    
    const csv = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation-${position?.pos_code || evaluationId}-results.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" />
            Evaluation Results
          </h1>
          <p className="text-muted-foreground mt-2">
            {position?.title} ({position?.pos_code})
          </p>
          {position?.department && (
            <p className="text-sm text-muted-foreground">
              {position.department.name}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push(`/${locale}/dashboard/${orgId}/org-structure/positions`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Positions
          </Button>
        </div>
      </div>
      
      {/* Score & Grade Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-2 border-primary/20 print-avoid-break">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Final Score */}
            <div className="text-center md:text-left">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Final Score
              </p>
              <p className="text-6xl font-bold text-primary">
                {evaluation.final_score.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Range: {evaluation.min_score} - {evaluation.max_score}
              </p>
            </div>
            
            {/* Divider */}
            <div className="hidden md:block h-24 w-px bg-border mx-auto" />
            
            {/* Grade */}
            <div className="text-center md:text-left">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Assigned Grade
              </p>
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <Badge variant="default" className="text-3xl px-6 py-3 font-bold">
                  Grade {evaluation.assigned_grade}
                </Badge>
              </div>
              <p className="text-sm font-medium mt-3">
                {typicalRole}
              </p>
            </div>
            
            {/* Completion Info */}
            <div className="text-center md:text-right text-sm text-muted-foreground md:col-span-3 pt-4 border-t">
              <p>Completed: {new Date(evaluation.completed_at).toLocaleString()}</p>
              <p>Calculated: {new Date(evaluation.calculated_at).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Factor Breakdown */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Factor Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {factors.map((factor, index) => {
            const percentage = (factor.weighted_points / evaluation.final_score) * 100;
            
            return (
              <Card key={factor.factor_code} className="print-avoid-break">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {factor.factor_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-muted-foreground">Total Points</span>
                      <span className="text-2xl font-bold">
                        {factor.total_points.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-muted-foreground">Weighted Points</span>
                      <span className="text-xl font-semibold text-primary">
                        {factor.weighted_points.toFixed(2)}
                      </span>
                    </div>
                    <div className="pt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Contribution to final score</span>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      
      {/* Visualization */}
      <Card className="print-avoid-break">
        <CardHeader>
          <CardTitle>Factor Contribution</CardTitle>
        </CardHeader>
        <CardContent>
          <FactorContributionChart factors={factors} />
        </CardContent>
      </Card>
      
      {/* Dimension Details */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Dimension Details</h2>
        
        {/* Group dimensions by factor */}
        {factors.map(factor => {
          const factorDimensions = dimensions.filter(d => d.factor_code === factor.factor_code);
          
          return (
            <Card key={factor.factor_code} className="mb-4 print-avoid-break">
              <CardHeader>
                <CardTitle className="text-lg">{factor.factor_name}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-semibold text-sm">Dimension</th>
                        <th className="text-center p-3 font-semibold text-sm">Selected Level</th>
                        <th className="text-center p-3 font-semibold text-sm">Max Level</th>
                        <th className="text-right p-3 font-semibold text-sm">Raw Points</th>
                        <th className="text-right p-3 font-semibold text-sm">Weighted Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {factorDimensions.map(dim => (
                        <tr key={dim.dimension_code} className="hover:bg-muted/30">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{dim.dimension_name}</p>
                              <p className="text-xs text-muted-foreground">{dim.dimension_code}</p>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="default">S{dim.selected_level}</Badge>
                          </td>
                          <td className="p-3 text-center text-muted-foreground">
                            S{dim.max_level}
                          </td>
                          <td className="p-3 text-right font-mono">
                            {dim.raw_points}
                          </td>
                          <td className="p-3 text-right font-semibold">
                            {dim.weighted_points.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {/* Factor Total Row */}
                      <tr className="bg-muted/50 font-semibold">
                        <td className="p-3" colSpan={3}>
                          {factor.factor_name} Total
                        </td>
                        <td className="p-3 text-right">
                          {factor.total_points.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-primary">
                          {factor.weighted_points.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Results cards will go here */}
    </div>
  );
}
