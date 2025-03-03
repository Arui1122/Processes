// src/utils/elasticSearchSetup.ts
import client from '@src/config/elasticsearch';
import { Post } from '@src/models/post';
import { User } from '@src/models/user';
import { IUserDocument } from '@src/models/user';

export async function setupElasticsearch() {
    const MAX_RETRIES = 3;
    let currentRetry = 0;

    while (currentRetry < MAX_RETRIES) {
        try {
            console.log(`嘗試連接Elasticsearch (嘗試 ${currentRetry + 1}/${MAX_RETRIES})...`);

            // 首先檢查Elasticsearch是否可以連接 - 修正了timeout參數的用法
            try {
                await client.ping();
                console.log("連接Elasticsearch成功，繼續設置索引...");
            } catch (pingError) {
                const errorMessage = pingError instanceof Error ? pingError.message : String(pingError);
                throw new Error(`Elasticsearch服務不可用: ${errorMessage}`);
            }

            // 檢查索引是否存在
            const postsIndexExists = await client.indices.exists({
                index: 'posts'
            });

            const usersIndexExists = await client.indices.exists({
                index: 'users'
            });

            // 創建貼文索引
            if (!postsIndexExists) {
                console.log("創建posts索引...");
                await client.indices.create({
                    index: 'posts',
                    settings: {
                        analysis: {
                            analyzer: {
                                chinese_analyzer: {
                                    type: 'custom',
                                    tokenizer: 'smartcn_tokenizer'
                                },
                                english_analyzer: {
                                    type: 'custom',
                                    tokenizer: 'standard',
                                    filter: [
                                        'lowercase',
                                        'asciifolding',
                                        'english_stop',
                                        'english_stemmer',
                                        'english_possessive_stemmer',
                                        'edge_ngram_filter'
                                    ]
                                }
                            },
                            filter: {
                                ngram_filter: {
                                    type: 'ngram',
                                    min_gram: 1,
                                    max_gram: 2
                                },
                                edge_ngram_filter: {
                                    type: 'edge_ngram',
                                    min_gram: 2,
                                    max_gram: 15
                                },
                                english_stop: {
                                    type: 'stop',
                                    stopwords: '_english_'
                                },
                                english_stemmer: {
                                    type: 'stemmer',
                                    language: 'english'
                                },
                                english_possessive_stemmer: {
                                    type: 'stemmer',
                                    language: 'possessive_english'
                                }
                            }
                        }
                    },
                    mappings: {
                        properties: {
                            content: {
                                type: 'text',
                                analyzer: 'chinese_analyzer',
                                search_analyzer: 'chinese_analyzer',
                                fields: {
                                    english: {
                                        type: 'text',
                                        analyzer: 'english_analyzer',
                                        search_analyzer: 'english_analyzer'
                                    }
                                }
                            },
                            userId: { type: 'keyword' },
                            userName: {
                                type: 'text',
                                analyzer: 'chinese_analyzer',
                                fields: {
                                    english: {
                                        type: 'text',
                                        analyzer: 'english_analyzer'
                                    },
                                    keyword: {
                                        type: 'keyword'
                                    }
                                }
                            },
                            createdAt: { type: 'date' }
                        }
                    }
                });
                console.log("posts索引創建成功");
            }

            // 創建用戶索引
            if (!usersIndexExists) {
                console.log("創建users索引...");
                await client.indices.create({
                    index: 'users',
                    settings: {
                        analysis: {
                            analyzer: {
                                chinese_analyzer: {
                                    type: 'custom',
                                    tokenizer: 'standard',
                                    filter: [
                                        'lowercase',
                                        'asciifolding',
                                        'ngram_filter'
                                    ],
                                    char_filter: [
                                        'html_strip'
                                    ]
                                },
                                english_analyzer: {
                                    type: 'custom',
                                    tokenizer: 'standard',
                                    filter: [
                                        'lowercase',
                                        'asciifolding',
                                        'english_stop',
                                        'english_stemmer',
                                        'english_possessive_stemmer',
                                        'edge_ngram_filter'
                                    ]
                                }
                            },
                            filter: {
                                ngram_filter: {
                                    type: 'ngram',
                                    min_gram: 1,
                                    max_gram: 2
                                },
                                edge_ngram_filter: {
                                    type: 'edge_ngram',
                                    min_gram: 2,
                                    max_gram: 15
                                },
                                english_stop: {
                                    type: 'stop',
                                    stopwords: '_english_'
                                },
                                english_stemmer: {
                                    type: 'stemmer',
                                    language: 'english'
                                },
                                english_possessive_stemmer: {
                                    type: 'stemmer',
                                    language: 'possessive_english'
                                }
                            }
                        }
                    },
                    mappings: {
                        properties: {
                            userName: {
                                type: 'text',
                                analyzer: 'chinese_analyzer',
                                fields: {
                                    english: {
                                        type: 'text',
                                        analyzer: 'english_analyzer'
                                    },
                                    keyword: {
                                        type: 'keyword'
                                    }
                                }
                            },
                            accountName: {
                                type: 'text',
                                analyzer: 'chinese_analyzer',
                                fields: {
                                    english: {
                                        type: 'text',
                                        analyzer: 'english_analyzer'
                                    },
                                    keyword: {
                                        type: 'keyword'
                                    }
                                }
                            },
                            bio: {
                                type: 'text',
                                analyzer: 'chinese_analyzer',
                                fields: {
                                    english: {
                                        type: 'text',
                                        analyzer: 'english_analyzer'
                                    }
                                }
                            },
                            isPublic: { type: 'boolean' },
                            avatarUrl: { type: 'keyword' },
                            followersCount: { type: 'integer' },
                            followingCount: { type: 'integer' },
                            createdAt: { type: 'date' }
                        }
                    }
                });
                console.log("users索引創建成功");
            }

            // 同步現有的貼文
            console.log("獲取現有貼文和用戶數據...");
            const posts = await Post.find().populate('user', 'userName');
            const users = await User.find();

            // 如果有現有的貼文，執行批量索引
            if (posts.length > 0) {
                console.log(`同步 ${posts.length} 條貼文到Elasticsearch...`);
                try {
                    const bulkOperations = posts.flatMap(post => [
                        { index: { _index: 'posts', _id: post._id.toString() } },
                        {
                            content: post.content,
                            userId: post.user._id.toString(),
                            userName: (post.user as IUserDocument).userName,
                            createdAt: post.createdAt
                        }
                    ]);

                    await client.bulk({
                        operations: bulkOperations,
                        refresh: true
                    });
                    console.log("貼文同步完成");
                } catch (bulkError) {
                    console.error("貼文批量同步失敗:", bulkError);
                    // 繼續執行，不中斷整個過程
                }
            }

            // 如果有現有的用戶，執行批量索引
            if (users.length > 0) {
                console.log(`同步 ${users.length} 個用戶到Elasticsearch...`);
                try {
                    const bulkOperations = users.flatMap(user => [
                        { index: { _index: 'users', _id: user._id.toString() } },
                        {
                            userName: user.userName,
                            accountName: user.accountName,
                            bio: user.bio || '',
                            isPublic: user.isPublic,
                            avatarUrl: user.avatarUrl,
                            followersCount: user.followersCount,
                            followingCount: user.followingCount,
                            createdAt: user.createdAt
                        }
                    ]);

                    await client.bulk({
                        operations: bulkOperations,
                        refresh: true
                    });
                    console.log("用戶同步完成");
                } catch (bulkError) {
                    console.error("用戶批量同步失敗:", bulkError);
                    // 繼續執行，不中斷整個過程
                }
            }

            console.log('Elasticsearch設置成功完成');
            return; // 成功完成，退出函數

        } catch (error) {
            currentRetry++;
            console.error(`Elasticsearch設置失敗 (嘗試 ${currentRetry}/${MAX_RETRIES}):`, error);

            if (currentRetry >= MAX_RETRIES) {
                console.log("已達最大重試次數，應用程序將在沒有完整Elasticsearch功能的情況下繼續運行");
                // 不再拋出錯誤，允許應用程序繼續運行
                return;
            }

            // 等待時間隨著重試次數增加而增加（1秒、2秒、4秒）
            const waitTime = Math.pow(2, currentRetry - 1) * 1000;
            console.log(`等待 ${waitTime}ms 後重試...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}