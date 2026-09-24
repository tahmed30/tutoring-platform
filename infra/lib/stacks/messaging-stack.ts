import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../../config';

export interface MessagingStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
}

/**
 * SNS + SQS for async notifications and an EventBridge schedule stub
 * for payment / class reminders.
 */
export class MessagingStack extends cdk.Stack {
  public readonly notificationsTopic: sns.Topic;
  public readonly notificationsQueue: sqs.Queue;
  public readonly deadLetterQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: MessagingStackProps) {
    super(scope, id, props);

    const { config } = props;
    const prefix = `tutoring-${config.envName}`;

    this.deadLetterQueue = new sqs.Queue(this, 'NotificationsDlq', {
      queueName: `${prefix}-notifications-dlq`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });

    this.notificationsQueue = new sqs.Queue(this, 'NotificationsQueue', {
      queueName: `${prefix}-notifications`,
      visibilityTimeout: cdk.Duration.seconds(60),
      retentionPeriod: cdk.Duration.days(4),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: this.deadLetterQueue,
        maxReceiveCount: 3,
      },
    });

    this.notificationsTopic = new sns.Topic(this, 'NotificationsTopic', {
      topicName: `${prefix}-notifications`,
      displayName: `Tutoring notifications (${config.envName})`,
    });

    this.notificationsTopic.addSubscription(
      new subscriptions.SqsSubscription(this.notificationsQueue, {
        rawMessageDelivery: true,
      }),
    );

    // Stub: daily reminder tick — wire to Lambda or ECS task later
    const reminderRule = new events.Rule(this, 'DailyReminderStub', {
      ruleName: `${prefix}-daily-reminders`,
      description:
        'Stub schedule for payment / class reminders (target placeholder)',
      schedule: events.Schedule.cron({ minute: '0', hour: '14' }), // 14:00 UTC
    });

    // Publish a reminder event onto SNS so the queue worker can process it
    reminderRule.addTarget(
      new targets.SnsTopic(this.notificationsTopic, {
        message: events.RuleTargetInput.fromObject({
          type: 'SCHEDULED_REMINDER',
          source: 'eventbridge',
          env: config.envName,
          note: 'Replace with dedicated reminder Lambda when ready',
        }),
      }),
    );

    // Allow EventBridge to publish (targets.SnsTopic grants this; keep role doc)
    this.notificationsTopic.grantPublish(
      new iam.ServicePrincipal('events.amazonaws.com'),
    );

    new cdk.CfnOutput(this, 'NotificationsTopicArn', {
      value: this.notificationsTopic.topicArn,
    });
    new cdk.CfnOutput(this, 'NotificationsQueueUrl', {
      value: this.notificationsQueue.queueUrl,
    });
  }
}
